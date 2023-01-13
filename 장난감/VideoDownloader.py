import urllib.request
import datetime


def save_video(directory, file_name, video_url):
    # 파일 저장 경로 (이름)
    save_name = 'download/' + directory + '/' + file_name + '.mp4'
    # 파일을 저장하는 메소드
    urllib.request.urlretrieve(video_url, save_name)


video_list = [
    # 디렉토리 1 의 비디오 리스트
    [
        ['파일 이름 1', '비디오 URL'],
        ['파일 이름 2', '비디오 URL']
    ],

    # 디렉토리 2 의 비디오 리스트
    [
        ['파일 이름 1', '비디오 URL'],
        ['파일 이름 2', '비디오 URL']
    ]
]

# 시작 시간 체크
print('다운로드 시작 ' + str(datetime.datetime.now()))

# 디렉토리 순서
order = ['저장될 디렉토리 이름 1',
         '저장될 디렉토리 이름 2']

for o in range(len(order)):

    # 디렉토리의 비디오 개수 만큼 반복
    for i in range(len(video_list[o])):

        # (디렉토리 이름, 파일 이름, 비디오 URL)
        save_video(order[o], video_list[o][i][0], video_list[o][i][1])

        # 파일 별 다운로드 시간 체크
        print(str(o) + '번 폴더 ( ' + str(i + 1) + ' / ' + str(len(video_list[o]))
              + ' ) 번 째 다운로드 완료 ' + str(datetime.datetime.now()))

# 완료 시간 체크
print('다운로드 끝' + str(datetime.datetime.now()))
