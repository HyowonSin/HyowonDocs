const express = require('express');
const path = require('path');
const puppeteer = require('puppeteer');
const fs = require('fs').promises;
const app = express();
const PORT = 3000;

// 미들웨어 설정
app.use(express.json());
app.use(express.static(path.join(__dirname, '../public')));

// 전역 변수 선언
let globalBrowser = null;
let mainPage = null;
const sessions = [];

let currentProgress = 'Preparing to create schema...';

// 진행 상태 업데이트 함수
function updateProgress(message) {
    currentProgress = message;
    console.log(message);
}

// session.json 파일 경로
const SESSION_FILE = path.join(__dirname, 'data', 'session.json');

// session.json 읽기 함수
async function readSessions() {
    try {
        const data = await fs.readFile(SESSION_FILE, 'utf8');
        return JSON.parse(data);
    } catch (error) {
        // 파일이 없거나 비어있으면 빈 배열 반환
        return [];
    }
}

// session.json 쓰기 함수
async function writeSessions(sessions) {
    await fs.writeFile(SESSION_FILE, JSON.stringify(sessions, null, 2), 'utf8');
}

// 📌 1️⃣ 스키마 목록 조회
app.get('/schemas', (req, res) => {
    console.log('조회된 세션들:', sessions);  // 디버깅용 로그
    res.json({ 
        success: true, 
        schemas: sessions 
    });
});

// 브라우저 초기화 함수
async function initBrowser() {
    if (!globalBrowser) {
        console.log('Initializing browser...');
        globalBrowser = await puppeteer.launch({ 
            headless: false,
            slowMo: 50,
            args: ['--no-sandbox', '--disable-setuid-sandbox']
        });
        
        // 브라우저가 예기치 않게 종료되었을 때의 처리
        globalBrowser.on('disconnected', async () => {
            console.log('Browser unexpectedly closed');
            globalBrowser = null;
            mainPage = null;
            await initBrowser();
        });
        
        mainPage = await globalBrowser.newPage();
        await mainPage.goto('https://erd-editor.io/');
        console.log('Browser ready');
    }
    return globalBrowser;
}

// 📌 2️⃣ 새 스키마 생성 (임시 URL 방식)
app.get('/progress', (req, res) => {
    res.writeHead(200, {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive'
    });
    
    const sendProgress = () => {
        res.write(`data: ${JSON.stringify({ message: currentProgress })}\n\n`);
    };
    
    const progressInterval = setInterval(sendProgress, 100);
    
    req.on('close', () => {
        clearInterval(progressInterval);
    });
});

app.post('/schemas', async (req, res) => {
    const { schemaName } = req.body;
    
    try {
        if (!globalBrowser) {
            updateProgress('Initializing browser...');
            await initBrowser();
        }
        
        updateProgress('Finding New Schema button...');
        await mainPage.waitForFunction(() => {
            const buttons = Array.from(document.querySelectorAll('button'));
            return buttons.some(button => button.textContent === 'New Schema');
        });
        
        await mainPage.evaluate(() => {
            const buttons = Array.from(document.querySelectorAll('button'));
            const newSchemaButton = buttons.find(button => button.textContent === 'New Schema');
            if (newSchemaButton) newSchemaButton.click();
        });
        
        updateProgress('Entering schema name...');
        await mainPage.waitForSelector('input[placeholder="schema name"]');
        await mainPage.type('input[placeholder="schema name"]', schemaName);
        await mainPage.keyboard.press('Enter');
        
        updateProgress('Setting up collaboration...');
        await new Promise(resolve => setTimeout(resolve, 2000));
        await mainPage.waitForFunction((name) => {
            const items = Array.from(document.querySelectorAll('.rt-Flex.css-xkzija'));
            return items.some(item => {
                const nameSpan = item.querySelector('.rt-Text');
                return nameSpan && nameSpan.textContent === name;
            });
        }, {}, schemaName);
        
        updateProgress('Starting collaborative session...');
        await mainPage.evaluate((name) => {
            const items = Array.from(document.querySelectorAll('.rt-Flex.css-xkzija'));
            const targetItem = items.find(item => {
                const nameSpan = item.querySelector('.rt-Text');
                return nameSpan && nameSpan.textContent === name;
            });
            if (targetItem) {
                const collaborativeButton = targetItem.querySelector('.collaborative');
                if (collaborativeButton) collaborativeButton.click();
            }
        }, schemaName);
        
        updateProgress('Configuring session settings...');
        await new Promise(resolve => setTimeout(resolve, 1000));
        await mainPage.waitForFunction(() => {
            const buttons = Array.from(document.querySelectorAll('button'));
            return buttons.some(button => button.textContent === 'Start session');
        });
        
        await mainPage.evaluate(() => {
            const buttons = Array.from(document.querySelectorAll('button'));
            const startButton = buttons.find(button => button.textContent === 'Start session');
            if (startButton) startButton.click();
        });
        
        updateProgress('Setting nickname...');
        await new Promise(resolve => setTimeout(resolve, 1000));
        await mainPage.waitForSelector('input[placeholder="Your nickname"]');
        
        const currentNickname = await mainPage.evaluate(() => {
            const nicknameInput = document.querySelector('input[placeholder="Your nickname"]');
            return nicknameInput ? nicknameInput.value : '';
        });
        
        if (!currentNickname) {
            await mainPage.type('input[placeholder="Your nickname"]', 'master');
        }
        
        updateProgress('Getting session URL...');
        const url = await mainPage.evaluate(() => {
            const urlInput = Array.from(document.querySelectorAll('input')).find(
                input => input.value.startsWith('https://erd-editor.io/live/')
            );
            return urlInput ? urlInput.value : null;
        });
        
        if (url) {
            sessions.push({
                name: schemaName,
                url: url,
                createdAt: new Date().toISOString()
            });
            
            updateProgress('Closing setup dialog...');
            await mainPage.waitForFunction(() => {
                const buttons = Array.from(document.querySelectorAll('button'));
                return buttons.some(button => button.textContent === 'Close');
            });
            
            await mainPage.evaluate(() => {
                const buttons = Array.from(document.querySelectorAll('button'));
                const closeButton = buttons.find(button => button.textContent === 'Close');
                if (closeButton) closeButton.click();
            });
            
            updateProgress('Schema created successfully!');
            res.json({ 
                success: true, 
                url: url,
                message: 'Schema created successfully!'
            });
        } else {
            throw new Error('Failed to get session URL');
        }
        
    } catch (error) {
        console.error('Schema creation error:', error);
        updateProgress('An error occurred');
        res.status(500).json({ 
            success: false, 
            error: 'Failed to create schema', 
            details: error.message 
        });
    }
});

// 📌 3️⃣ 스키마 삭제
app.delete('/schemas/:name', (req, res) => {
    const schemaName = req.params.name;
    const index = sessions.findIndex(s => s.name === schemaName);
    
    if (index !== -1) {
        sessions.splice(index, 1);
        res.json({ 
            success: true, 
            message: '스키마가 삭제되었습니다.' 
        });
    } else {
        res.status(404).json({ 
            success: false, 
            error: '스키마를 찾을 수 없습니다.' 
        });
    }
});

// 서버 실행
app.listen(PORT, () => {
    console.log(`🚀 Server running at http://localhost:${PORT}`);
});

// 서버 시작 시 브라우저 초기화
initBrowser().catch(console.error);
