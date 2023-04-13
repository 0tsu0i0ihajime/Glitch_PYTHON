const express = require("express");
const session = require('express-session');
const bodyParser = require("body-parser");
const cookieParser = require("cookie-parser");
const ytdl = require("ytdl-core");
const path = require("path");
const fs = require("fs");
const app = express();

let userNumber = 1;
// let qrCodeRead = false;

app.use(
    session({
        secret: 'mysecretKeyCode',// セッションの暗号化に使用するキー
        resave: false,// セッションの再保存を強制しない
        saveUninitialized: false,// 未初期化のセッションを保存しない
        cookie: {
            secure: true,//　HTTPS通信のみに限定する
            sameSight: 'strict',//　SameSite属性をstrictに設定する
            maxAge: 60*60*1000*24//　セッションの有効期限を24時間に設定 ここ変える？
        }
    })
);
app.use(express.static("public"));
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
app.use(cookieParser());

app.get("/", (req, res) => {
    if(req.cookies.sessionID){
        res.sendFile(path.join(__dirname, "public", "stream.html"));
    }else{
        res.sendFile(path.join(__dirname, "public", "QRREADER.html"));
    }
});

app.post("/data", (req, res) => {
    const qrCodeData = req.body.qr;
    //console.log(`QRコードから読み込まれたデータ：${qrCodeData}`);//テストモード用
    const validQRCodeData = "04afahfakjfvizovhsoigeewpUwr326";
    if (qrCodeData === validQRCodeData) {
        const sessionId = req.session.id;//セッションIDを取得し、新しいセッションIDが必要な場合は生成する。
        res.cookie('sessionID', sessionId, {
            secure: true, // HTTPS通信のみに限定する
            sameSite: 'strict', // SameSite属性をstrictに設定する
            maxAge: 60*60*1000*24*365 // セッションの有効期限を1年間に設定
        });
        fs.appendFileSync('Cookie.json', JSON.stringify({[`userCookie_${userNumber}`]: sessionId}))
        res.redirect('/stream.html')
    } else {
        res.status(400).send('Invalid QR Code');
        (()=>{
            setInterval(()=>{
                res.redirect('https://www.youtube.com/');
            },3000);
        })();
    }
});


app.get("/stream", async (req, res) => {
    const videoUrl = req.query.videoUrl;
    const video = ytdl(videoUrl, {
        quality: 'highestaudio',
        filter: 'audioonly'
    });
    //const audioStream = ytdl(videoUrl, { filter: "audioonly" });
    const filepath = path.join(__dirname, 'temp', `${Date.now()}.mp3`);
    const filestream = fs.createWriteStream(filepath);
    video.pipe(filestream);
    res.set({
        'Content-Type': 'audio/mpeg',
        'Transfer-Encoding': 'chunked'
    });
    video.pipe(res);
    video.on('end', () => {
        fs.unlink(filepath, (err) => {
            if (err) console.log(err);
        });
    });
});

app.listen(process.env.PORT || 8080, () => {
    console.log(`Server listening on port ${process.env.PORT || 8080}`);
});
