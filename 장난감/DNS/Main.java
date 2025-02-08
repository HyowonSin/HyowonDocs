import java.net.DatagramPacket;
import java.net.DatagramSocket;
import java.net.InetAddress;
import java.nio.ByteBuffer;
import java.util.Objects;
import java.util.Scanner;

public class Main {
	public static void main(String[] args) throws Exception {

		var datagramSocket = new DatagramSocket();
		datagramSocket.connect(InetAddress.getByName("1.1.1.1"), 53);

		int id = 1;
		while (true) {
			System.out.print("도메인 입력 : ");
			var domain = new Scanner(System.in).nextLine();

			System.out.printf("Q타입 : ");
			var qtype = new Scanner(System.in).nextLine();

			var query = makeQuery(id, domain, qtype);
			if (query == null) {
				continue;
			}

			// query 2진수 출력
			//System.out.println("\n[Query]");
			//printBinary(query);

			datagramSocket.send(new DatagramPacket(query, query.length));

			var response = new byte[1024];
			var received = new DatagramPacket(response, response.length);
			datagramSocket.receive(received);

			System.out.println("\n[Response]");
			System.out.println("메시지 길이 : " + received.getLength() + " bytes");

			// 출력
			// printBinary(received);

			var ancount = parseHeader(received.getData(), domain.length() + 2);
			var index = 12;
			index = parseQuestion(received.getData(), index, qtype);
			parseAnswer(received.getData(), index, ancount, qtype);
		}
	}

	private static byte[] makeQuery(int id, String domain, String qtype) {
		var domainLength = domain.length() + 2;
		var query = new byte[domainLength + 16];

		// ID
		query[0] = (byte)(id >> 8);
		query[1] = (byte)(id);
		id++;
		query[2] = 0b00000000; // QR(1) Opcode(4) AA(1) TC(1) RD(1)
		query[3] = 0b00000000; // RA(1) Z(3) RCODE(4)
		// QDCOUNT
		query[4] = 0x00;
		query[5] = 0x01;
		// ANCOUNT
		query[6] = 0x00;
		query[7] = 0x00;
		// NSCOUNT
		query[8] = 0x00;
		query[9] = 0x00;
		// ARCOUNT
		query[10] = 0x00;
		query[11] = 0x00;

		// QNAME
		var index = 12;
		var domainSplit = domain.split("\\.");
		for (var s : domainSplit) {
			query[index++] = (byte)s.length();
			for (var i = 0; i < s.length(); i++) {
				query[index++] = (byte)s.charAt(i);
			}
		}
		query[index++] = 0x00;

		// QTYPE
		if (Objects.equals(qtype, "A")) {
			query[index++] = 0x00;
			query[index++] = 0x01;
		} else if (Objects.equals(qtype, "MX")) {
			query[index++] = 0x00;
			query[index++] = 0x0f;
		} else {
			System.out.println("잘못된 Q타입입니다.");
			return null;
		}

		// QCLASS
		// IN (1)
		query[index++] = 0x00;
		query[index++] = 0x01;

		return query;
	}

	private static void printBinary(byte[] query) {
		for (var i = 0; i < query.length; i++) {
			var binary = Integer.toBinaryString(query[i] & 0xFF);
			while (binary.length() < 8) {
				binary = "0" + binary;
			}
			System.out.print(binary + " ");
			if ((i + 1) % 2 == 0) {
				System.out.println();
			}
		}
	}

	private static void printOctet(DatagramPacket packet) {
		for (var i = 0; i < packet.getLength(); i++) {
			System.out.printf("%02x ", packet.getData()[i]);
			if ((i + 1) % 2 == 0) {
				System.out.println();
			}
		}
		System.out.println();
	}

	private static void printBinary(DatagramPacket packet) {
		for (var i = 0; i < packet.getLength(); i++) {
			var binary = Integer.toBinaryString(packet.getData()[i] & 0xFF);
			while (binary.length() < 8) {
				binary = "0" + binary;
			}
			System.out.print(binary + " ");
			if ((i + 1) % 2 == 0) {
				System.out.println();
			}
		}
		System.out.println();
	}


	public static int parseHeader(byte[] packet, int domainLength) {
		var buffer = ByteBuffer.wrap(packet);
		System.out.println("\n[Header]");
		System.out.println("ID : " + buffer.getShort());
		var flags = buffer.getShort();
		System.out.println("QR : " + ((flags & 0b1000000000000000) >> 15));
		System.out.println("Opcode : " + ((flags & 0b0111100000000000) >> 11));
		System.out.println("AA : " + ((flags & 0b0000010000000000) >> 10));
		System.out.println("TC : " + ((flags & 0b0000001000000000) >> 9));
		System.out.println("RD : " + ((flags & 0b0000000100000000) >> 8));
		System.out.println("RA : " + ((flags & 0b0000000010000000) >> 7));
		System.out.println("Z : " + ((flags & 0b0000000001110000) >> 4));
		System.out.println("RCODE : " + (flags & 0b0000000000001111));
		System.out.println("QDCOUNT : " + buffer.getShort());
		var ancount = buffer.getShort();
		System.out.println("ANCOUNT : " + ancount);
		System.out.println("NSCOUNT : " + buffer.getShort());
		System.out.println("ARCOUNT : " + buffer.getShort());

		return ancount;
	}

	public static int parseQuestion(byte[] packet, int index, String qtype) {
		System.out.println("\n[Question]");
		var qname = parseName(packet, index);
		System.out.println("QNAME : " + qname);
		index = index + qname.length() + 2;
		System.out.println("QTYPE : " + ByteBuffer.wrap(packet, index, 2).getShort() + " (" + qtype + ")");
		System.out.println("QCLASS : " + ByteBuffer.wrap(packet, index + 2, 2).getShort());
		index += 4;

		return index;
	}

	public static int parseAnswer(byte[] packet, int index, int ancount, String qtype) {
		var buffer = ByteBuffer.wrap(packet);
		System.out.println("\n[Answer]");
		for (var i = 0; i < ancount; i++) {
			var isCompressed = (packet[index] & 0b11000000) == 0b11000000;
			if(isCompressed) {
				var pointer = buffer.getShort(index) & 0b0011111111111111;
				System.out.println("NAME : " + parseName(packet, pointer));
				index += 2;
			} else {
				var name = parseName(packet, index);
				System.out.println("NAME : " + name);
				index += name.length() + 2;
			}

			buffer.position(index);
			System.out.println("TYPE : " + buffer.getShort());
			System.out.println("CLASS : " + buffer.getShort());
			System.out.println("TTL : " + (buffer.getInt() & 0xffffffffL));
			var rdlength = buffer.getShort();
			System.out.println("RDLENGTH : " + (rdlength & 0xffff));
			index += 10;
			if (Objects.equals(qtype, "A")) {
				System.out.print("RDATA : ");
				for (var j = 0; j < rdlength; j++) {
					var b = buffer.get();
					System.out.printf("%d", b & 0xff);
					if (j != rdlength - 1) {
						System.out.print(".");
					}
				}
				index += rdlength;
			} else if (Objects.equals(qtype, "MX")) {
				var preference = buffer.getShort();
				index += 2;
				System.out.println("PREFERENCE : " + preference);
				StringBuilder exchange = new StringBuilder();
				for (var j = 0; j < rdlength - 2;) {
					var isCompressed2 = (packet[index] & 0b11000000) == 0b11000000;
					if (isCompressed2) {
						var pointer = buffer.getShort(index) & 0b0011111111111111;
						exchange.append(parseName(packet, pointer));
						index += 2;
						j += 2;
					} else {
						int count = packet[index];
						StringBuilder name = new StringBuilder();
						for (var k = 0; k < count; k++) {
							name.append((char)packet[index + 1 + k]);
						}
						exchange.append(name);
						index += name.length() + 1;
						j += name.length() + 1;
					}
					if (j != rdlength - 2) {
						exchange.append(".");
					}
				}
				System.out.print("EXCHANGE : " + exchange.toString());
			}
			System.out.println();
		}
		System.out.println();
		return index;
	}

	private static String parseName(byte[] packet, int index) {
		var name = new StringBuilder();
		while (packet[index] != 0) {
			int count = packet[index];
			for (var i = 0; i < packet[index]; i++) {
				name.append((char)packet[index + 1 + i]);
			}
			index += count + 1;
			if (packet[index + 1] != 0) {
				name.append(".");
			}
		}
		return name.toString();
	}
}

