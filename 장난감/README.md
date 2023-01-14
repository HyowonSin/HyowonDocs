# 장나감 - 비디오 스크레이퍼

스트리밍 동영상을 저장하고 싶었다.

처음엔 구글 크롬의 개발자 도구를 이용했다.  
동영상을 실행하면 Network 의 Media 탭에서 mp4 파일의 소스 URL을 얻을 수 있었다.  
이를 통해 동영상을 하나씩 다른 이름으로 저장하였다.  

하지만 영상을 조금 저장하다 보니 너무 번거로웠다.  
그래서 자동화를 마음 먹게 되었다.  

비디오의 소스 URL이 있기 때문에 이를 다운로드하여 저장하는 방법은 간단했다.  
urllib 의 requests 라이브러리를 사용했다.

물론 파이썬에서 파일을 다운로드하는 방법은 여러 가지 있었다.  
urllib 도 버전이 3까지 있었지만 다운로드 방식(?)은 같은 것 같았고  
urllib이 이미 있었기도 하고 코드도 간단하여 이를 사용했다.

(여담으로 나는 자바에서 함수/변수 이름에 Lower Camel Case 를 썼었는데,  
파이썬은 PEP8 에서  Snake Case 를 기준으로 제시하고 있었다)  
참고: 파이썬 스타일 가이드 → [https://peps.python.org/pep-0008/#indentation](https://peps.python.org/pep-0008/#indentation)

<br>

--- 
### VideoDownloader

```python
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
```

하지만 이 방법도 불편하긴 매한가지였다.  
왜냐하면 파일 이름과 비디오 URL 등을 수작업으로 기입했기 떄문..

또한 파일 다운로드 속도가 처참했다.  
영상 하나에 1~200 MB 정도의 MP4 파일인데 1시간에 10개 정도 다운로드 되었다.

이 부분은 추후 쓰레드의 개수를 늘리거나 파일을 분산화해서  
다운로드 속도를 올리는 방법이 있다고 하여 개선하기로 하고 일단 넘어갔다.

어쨌든 나는 너무 귀찮아서 아무래도 사이트를 스크래핑해야겠다고 마음먹게 되었다.

<br>

---

먼저 사이트 로그인이 필요해서 세션을 얻을 생각이었다.

requests 라이브러리를 사용해서 세션을 얻고 HTTP 요청을 보내보려 했다.
(혹은 urllib의 쿠키를 유지하는 방식 등)

하지만 내가 프론트엔드 쪽을 잘 몰라서 그런 건지 숨겨 놓은 건지  
Form Data 를 주고 받는 것을 찾지 못 해서 어려움을 겪었다.

아이디랑 비밀번호를 보내려 하는데 잘 보내지지 않았다.  
토큰은 보내주는 것 같기는 한데..
이걸 받아서 헤더에 넣어서 계속 보내야 하는 건지..

(참고 : [https://yeo0.github.io/data/2018/09/24/5.-로그인이-필요한-사이트에서의-크롤링/](https://yeo0.github.io/data/2018/09/24/5.-%EB%A1%9C%EA%B7%B8%EC%9D%B8%EC%9D%B4-%ED%95%84%EC%9A%94%ED%95%9C-%EC%82%AC%EC%9D%B4%ED%8A%B8%EC%97%90%EC%84%9C%EC%9D%98-%ED%81%AC%EB%A1%A4%EB%A7%81/))

<br>
성능이 급한 건 아니어서 selenium 과 beautifulsoup 를 활용해 보기로 하였다.

조금 더 원시적이지만 간단했다.  
Driver를 이용해 직접 브라우저를 띄우고 값을 입력, 클릭하는 등 물리적으로 접근하는 방식이었다.

그 중 크롬 브라우저를 이용할 생각이었다.  
먼저 로그인 화면에서 개발자 도구의 요소 검사 기능을 통해  
아이디와 비밀번호를 입력하는 인풋 박스의 name과
로그인 버튼의 x_path를 알아왔다. 

(참고 : [https://dodonam.tistory.com/228](https://dodonam.tistory.com/228))

<br>
필요한 라이브러리들을 추가해주고, 크롬 브라우저를 열기 위해 크롬 드라이버를 사용해야 한다.

```python
# 수정 전
from bs4 import BeautifulSoup
from selenium import webdriver
from selenium.webdriver.chrome.options import Options

chrome_options = Options()
chrome_options.add_argument('--headless')
chrome_options.add_argument('--no-sandbox')
chrome_options.add_argument('--disable-dev-shm-usage')
driver = webdriver.Chrome('/home/bdh/chromedriver', chrome_options=chrome_options)
```

일단은 위 블로그와 똑같이 코드를 입력했으나, 에러가 났다.  
`DeprecationWarning: executable_path has been deprecated`

이 때는 몰랐는데 셀레니움의 웹 드라이버에 크롬 드라이버 경로를 찾아서 넣었어야 했다.  
하지만 그냥 블로그 코드만 입력해서 안 돌아 갔던 거고,

저 경고 문구는 셀레니움이 4버전이 되면서 코드가 바껴서 그렇다고 한다.  
그 전에는 크롬 드라이버 버전과 사용 중인 크롬 브라우저 버전이 달라질 때 마다  
`SessionNotCreatedException` 에러가 났다고 한다.

<br>
그래서 조금 더 편하게 webdriver-manager 패키지와 셀레니움4에 생긴 Service 라는 기능을 이용했다.

현재 OS에 설치된 크롬 브라우저에 맞춰 드라이버를 설치한다.

(참고 : [https://velog.io/@sangyeon217/deprecation-warning-executablepath-has-been-deprecated](https://velog.io/@sangyeon217/deprecation-warning-executablepath-has-been-deprecated)  
참고 : [https://yeko90.tistory.com/entry/셀레니움-기초-executablepath-has-been-deprecated-please-pass-in-a-Service-object-에러-해결-방법](https://yeko90.tistory.com/entry/%EC%85%80%EB%A0%88%EB%8B%88%EC%9B%80-%EA%B8%B0%EC%B4%88-executablepath-has-been-deprecated-please-pass-in-a-Service-object-%EC%97%90%EB%9F%AC-%ED%95%B4%EA%B2%B0-%EB%B0%A9%EB%B2%95))

```python
# 수정 후
from bs4 import BeautifulSoup
from selenium import webdriver
from selenium.webdriver.chrome.service import Service
from webdriver_manager.chrome import ChromeDriverManager

# 옵션들의 의미는 사실 몰랐으나, 실행 시에 크롬 창이 켜지지 않아 일단은 전부 뺐다.
chrome_options = webdriver.ChromeOptions()
driver = webdriver.Chrome(service=Service(ChromeDriverManager().install()), options=chrome_options)
```

<br>
(여기서 webdriver-manager 패키지가 인식이 안 되는 에러가 있었다.

나는 Mac OS M1 을 사용 중이고, 파이참과 파이파이 인터프리터를 사용 중이었다.

터미널에 그냥

```python
pip install webdriver-manager
```

라고 쳤고 실제로 다운로드가 되긴 했다.

<br>
하지만 `Unresolved reference 'webdriver_manager’` 라고 떠서 찾아봤다.

(참고 : [https://stackoverflow.com/questions/65940622/unresolved-reference-error-from-webdriver-manager-chrome-import-chromedriverm](https://stackoverflow.com/questions/65940622/unresolved-reference-error-from-webdriver-manager-chrome-import-chromedriverm))

파이참 버전이 달라 세팅이란 게 안 보였다.  
**Preferences** 에서 **Project → Python Interpreter** 에 들어가서 
직접 webdriver-manager 패키지를 설치했다.

아마 내 생각엔 내가 예전에 만들어둔 파이참 프로젝트에 동작만 확인하려 py 파일을 하나 만들어 쓰고 있는데  
이 때 버전관리 해보겠다고,, venv 설정을 해뒀던 것 같은데,,  
그래서 로컬에 설치해도 프로젝트에 반영이 안 됐던 걸로 의심 중이다.. 윈도우에선 그냥 하니까 된 것 같은데..)

<br>
이제 로그인을 하도록 했다.  
브라우저를 열어서, 아이디와 비밀번호를 입력하고 로그인 버튼을 누르게 했다.

```python
# 나는 로그인하면 자동으로 메인 페이지로 리다이렉트 되는 사이트였다.
# 웹 페이지 로드 까지 시간을 기다림 (time.sleep 은 그냥 기다림)
driver.implicitly_wait(3)
driver.get('로그인 페이지 URL')  # get 요청

# 수정 전
driver.find_element_by_name('알아온 아이디 name').send_keys('아이디')
driver.find_element_by_name('알아온 비밀번호 name').send_keys('비밀번호')
driver.find_element_by_xpath('알아온 로그인 버튼 xpath').click()

# 수정 후
from selenium.webdriver.common.by import By

driver.find_element(By.NAME, '알아온 아이디 name').send_keys('아이디')
driver.find_element(By.NAME, '알아온 비밀번호 name').send_keys('비밀번호')
driver.find_element(By.XPATH, '알아온 로그인 버튼 xpath').click()
```

이 부분에서도 셀레니움이 4버전이 되면서 메소드 사용 방식에 변화가 생겼었다.  
내가 찾아본 블로그 들에선 수정 전과 같은 방식이었고  
원래는 경고 정도만 띄우며 호환이 됐었는데, 4.3 버전 부터 에러 처리가 된 것 같다.

지금 저렇게 코드를 짜자 `AttributeError: 'WebDriver' object has no attribute 'find_element_by_name’` 에러가 떴었다.  
물론 수정 후엔 잘 된다.

(참고 : https://stackoverflow.com/questions/72773206/selenium-python-attributeerror-webdriver-object-has-no-attribute-find-el)



