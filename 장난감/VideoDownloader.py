import urllib.request
import datetime

def save_video(directory, save_name, video_url):
    savename = 'download/' + directory + '/' + save_name + '.mp4'
    urllib.request.urlretrieve(video_url, savename)

videoList = [
    [
        ['', ''],
        ['', '']
    ],
    
    [
        ['', ''],
        ['', '']
    ]
]

print('다운로드 시작 ' + str(datetime.datetime.now()))

order = ['',
         '']
for o in range(len(order)):
    for i in range(len(videoList[o])):
        save_video(order[o], videoList[o][i][0], videoList[o][i][1])
        print(str(o) + '번 폴더 ( ' + str(i+1) +' / ' + str(len(videoList[o]))
              + ' ) 번 째 다운로드 완료 ' + str(datetime.datetime.now()))
