const express = require("express");
const bodyParser = require("body-parser");
const cookieParser = require("cookie-parser");
const ytdl = require("ytdl-core");
const app = express();
const path = require("path");
const fs = require("fs");

let qrCodeRead = false;

app.use(express.static("public"));
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
app.use(cookieParser());

app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "QRREADER.html"));
});

app.post("/data", (req, res) => {
  const qrCodeData = req.body.qr;
  //console.log(`QRコードから読み込まれたデータ：${qrCodeData}`);//テスト用コード
  const validQRCodeData = "04afahfakjfvizovhsoigeewpUwr326";
  if (qrCodeData === validQRCodeData) {
    //const expires = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000); //1年間有効なCookieを設定
    //res.cookie("authToken", "validToken", { expires: expires });
    res.redirect('/stream.html')
  } else {
    res.status(400).send('Invalid QR Code');
  }
});


app.get("/stream", async (req, res) => {
  const videoUrl = req.query.videoUrl;
  const video = ytdl(videoUrl, {
    quality:'highestaudio',
    filter:'audioonly'
  });
  //const audioStream = ytdl(videoUrl, { filter: "audioonly" });
  const filepath = path.join(__dirname, 'temp', `${Date.now()}.mp3`);
  const filestream = fs.createWriteStream(filepath);
  video.pipe(filestream);
  res.set({
    'Content-Type':'audio/mpeg',
    'Transfer-Encoding':'chunked'
  });
  video.pipe(res);
  video.on('end', ()=>{
    fs.unlink(filepath, (err)=>{
      if(err) console.log(err);
    });
  });
});

app.listen(process.env.PORT || 8080, () => {
  console.log(`Server listening on port ${process.env.PORT || 8080}`);
});
