"use strict";
class KarutaGenerator {

    constructor() {
        // 画像倍率
        this.scale = 1;
        // 画像のX座標
        this.imgPosX = 0;
        // 画像のY座標
        this.imgPosY = 0;

        // 画像をX軸Y軸にそれぞれどのくらいずらすか
        this.moveX = 0;
        this.moveY = 0;

        // かるたの枠色（絵札・読み札共通）
        this.frameColor = '#006400';
        // 絵札の背景色
        this.efudaBackgroudColor = '#FFFFFF';
        // 絵札の文字
        this.efudaText = '';
        // 読み札の文字
        this.yomifudaText = '';
        this.yomifudaTextSize = 150;
    }

    /***************************************
     * 初期処理
    ***************************************/
    initialize() {

        //-------------
        // ステップ１
        //-------------
        // ファイル選択
        const fileSelect = document.getElementById('imgSelectInput');
        fileSelect.addEventListener('change', this.fileSelected.bind(this));

        //-------------
        // ステップ２
        //-------------
        // 絵札キャンバス作成
        this.efudaCanvas = document.getElementById('efudaCanvas');
        this.efudaCanvas.width  = 1040;
        this.efudaCanvas.height = 1460;
        this.efudaCtx = this.efudaCanvas.getContext('2d');

        this.img = new Image();
        this.img.onload = () => {
            // 各スライダー等リセット
            this.#reset();
            // 画像を中央に配置するための座標計算
            this.#calculateImagePos();
            // 再描画
            this.#redraw(true, true, true);
        }

        // ズームスライダー
        this.zoomSlider = document.getElementById('zoomSlider');
        this.zoomSlider.min   = 0.1;
        this.zoomSlider.max   = 5;
        this.zoomSlider.value = 1;
        this.zoomSlider.step  = 'any';
        this.zoomSlider.addEventListener('input', this.zoomSliderChange.bind(this));

        // 横位置スライダー
        this.xPosSlider = document.getElementById('xPosMoveSlider');
        this.xPosSlider.min   = -500;
        this.xPosSlider.max   = 500;
        this.xPosSlider.value = 0;
        this.xPosSlider.step  = 'any';
        this.xPosSlider.addEventListener('input', this.xPosSliderChange.bind(this));

        // 縦位置スライダー
        this.yPosSlider = document.getElementById('yPosMoveSlider');
        this.yPosSlider.min   = -500;
        this.yPosSlider.max   = 500;
        this.yPosSlider.value = 0;
        this.yPosSlider.step  = 'any';
        this.yPosSlider.addEventListener('input', this.yPosSliderChange.bind(this));

        // かるた枠色
        const karutaFrameColorInput = document.getElementById('karutaFrameColorInput');
        karutaFrameColorInput.value = this.frameColor;
        karutaFrameColorInput.addEventListener('input', this.karutaFrameColorInputChange.bind(this));

        // 絵札の背景色
        const karutaEfudaBackgroundColorInput = document.getElementById('karutaEfudaBackgroundColorInput');
        karutaEfudaBackgroundColorInput.value = this.efudaBackgroudColor;
        karutaEfudaBackgroundColorInput.addEventListener('input', this.karutaEfudaBackgroundColorInput.bind(this));

        // 絵札の文字
        const karutaCircleTextInput = document.getElementById('karutaCircleTextInput');
        karutaCircleTextInput.value = this.efudaText;
        karutaCircleTextInput.addEventListener('input', this.karutaCircleTextInputChange.bind(this));

        //-------------
        // ステップ３
        //-------------
        // 読み札キャンバス作成
        this.yomifudaCanvas = document.getElementById('yomifudaCanvas');
        this.yomifudaCanvas.width  = 1040;
        this.yomifudaCanvas.height = 1460;
        this.yomifudaCtx = this.yomifudaCanvas.getContext('2d');

        // 読み札文字サイズスライダー
        this.yomifudaTextSizeSlider = document.getElementById('yomifudaTextSizeSlider');
        this.yomifudaTextSizeSlider.min   = 60;
        this.yomifudaTextSizeSlider.max   = 240;
        this.yomifudaTextSizeSlider.value = 150;
        this.yomifudaTextSizeSlider.step  = 1;
        this.yomifudaTextSizeSlider.addEventListener('input', this.yomifudaTextSizeSliderChange.bind(this));

        // 読み札の文字
        const karutaYomifudaTextInput = document.getElementById('karutaYomifudaTextInput');
        karutaYomifudaTextInput.value = this.yomifudaText;
        karutaYomifudaTextInput.addEventListener('input', this.karutaYomifudaTextInputChange.bind(this));

        //-------------
        // ステップ４
        //-------------
        const event = window.ontouchstart === undefined ? 'click' : 'touchstart';
        // 画像保存ボタン（画像生成）
        const imageGenerateButton = document.getElementById('imageGenerateButton');
        imageGenerateButton.addEventListener(event, this.generateImage.bind(this));

        // 絵札画像ダウンロードボタン
        this.efudaImageDownloadButton = document.getElementById('efudaImageDownloadButton');
        this.efudaImageDownloadButton.addEventListener(event, this.downloadEfudaImage.bind(this));
        this.efudaImageDownloadButton.style = 'display: none;';
        this.efudaImageDownloadButton.disabled = true;

        // 絵札画像ダウンロードボタン
        this.yomifudaImageDownloadButton = document.getElementById('yomifudaImageDownloadButton');
        this.yomifudaImageDownloadButton.addEventListener(event, this.downloadYomifudaImage.bind(this));
        this.yomifudaImageDownloadButton.style = 'display: none;';
        this.yomifudaImageDownloadButton.disabled = true;

        // 絵札画像
        this.outputKarutaEfudaImage = document.getElementById('outputKarutaEfudaImage');
        this.outputKarutaEfudaImage.style = 'display: none;';
        
        // 読み札画像
        this.outputKarutaYomifudaImage = document.getElementById('outputKarutaYomifudaImage');
        this.outputKarutaYomifudaImage.style = 'display: none;';

    }

    //---------------------------------------------
    // イベント発火系メソッド
    //---------------------------------------------

    /***************************************
     * 画像を読み込みキャンバスへ表示する
     * @param {Event} event 
     * @return {void}
    ***************************************/
    fileSelected(event) {
        const files = event.target.files;
        const fileReader = new FileReader();
        fileReader.readAsDataURL(files[0]);
        fileReader.onload = () => {
            const dataUrl = fileReader.result;
            this.img.src = dataUrl;
        }
    }

    /***************************************
     * ズームスライダー操作時に画像を拡大/縮小する
     * @param {Event} event 
     * @return {void}
    ***************************************/
    zoomSliderChange(event) {
        // 倍率の取得
        this.scale = event.target.value;
        // 座標の再計算
        this.#calculateImagePos();
        // 再描画
        this.#redraw(true, true, false);
    }

    /***************************************
     * 横位置スライダー操作時に画像を移動する
     * @param {Event} event 
     * @return {void}
    ***************************************/
    xPosSliderChange(event) {
        // 横位置の取得
        this.moveX = event.target.value;
        // 座標の再計算
        this.#calculateImagePos();
        // 再描画
        this.#redraw(true, true, false);
    }

    /***************************************
     * 縦位置スライダー操作時に画像を移動する
     * @param {Event} event 
     * @return {void}
    ***************************************/
    yPosSliderChange(event) {
        // 縦位置の取得
        this.moveY = event.target.value * -1; // スライダー移動時の上下を反転
        // 座標の再計算
        this.#calculateImagePos();
        // 再描画
        this.#redraw(true, true, false);
    }

    /***************************************
     * かるたの枠色指定時
     * @param {Event} event 
     * @return {void}
    ***************************************/
    karutaFrameColorInputChange(event) {
        // かるた枠色の取得
        this.frameColor = event.target.value;
        // 再描画
        this.#redraw(false, true, true);
    }

    /***************************************
     * 絵札の背景色指定時
     * @param {Event} event 
     * @return {void}
    ***************************************/
    karutaEfudaBackgroundColorInput(event) {
        // 絵札の背景色の取得
        this.efudaBackgroudColor = event.target.value;
        // 再描画
        this.#redraw(true, true, false);
    }

    /***************************************
     * 絵札の文字指定時
     * @param {Event} event 
     * @return {void}
    ***************************************/
    karutaCircleTextInputChange(event) {
        // かるた文字の取得
        this.efudaText = event.target.value.trim() ;
        // 再描画
        this.#redraw(false, true, false);
    }

    /***************************************
     * 読み札文字サイズスライダー操作時
     * @param {Event} event 
     * @return {void}
    ***************************************/
    yomifudaTextSizeSliderChange(event) {
        // 文字サイズの取得（数値へ変換）
        this.yomifudaTextSize = Number(event.target.value);
        // 再描画
        this.#redraw(false, false, true);
    }

    /***************************************
     * 読み札の文字指定時
     * @param {Event} event 
     * @return {void}
    ***************************************/
    karutaYomifudaTextInputChange(event) {
        // 読み札文字の取得
        this.yomifudaText = event.target.value.trim();
        // 再描画
        this.#redraw(false, false, true);
    }

    /***************************************
     * 画像を生成する
     * @param {Event} event 
     * @return {void}
    ***************************************/
    generateImage(event) {
        // img要素に表示
        const efudaImgUrl = this.efudaCanvas.toDataURL('image/png');
        this.outputKarutaEfudaImage.src = efudaImgUrl;
        this.outputKarutaEfudaImage.style = '';
        const yomifudaImgUrl = this.yomifudaCanvas.toDataURL('image/png');
        this.outputKarutaYomifudaImage.src = yomifudaImgUrl;
        this.outputKarutaYomifudaImage.style = '';
        // ダウンロードボタンを有効にする
        this.efudaImageDownloadButton.style = '';
        this.efudaImageDownloadButton.disabled = false;
        this.yomifudaImageDownloadButton.style = '';
        this.yomifudaImageDownloadButton.disabled = false;
    }

    /***************************************
     * 絵札画像を保存する
     * @param {Event} event 
     * @return {void}
    ***************************************/
    downloadEfudaImage(event) {
        // ダウンロード
        const dummyLink = document.createElement('a');
        dummyLink.type     = 'application/octet-stream';
        dummyLink.download = `karuta_e_${KarutaGenerator.#getDateTimeString()}.png`;
        dummyLink.href = this.outputKarutaEfudaImage.src;
        dummyLink.click();
    }

    /***************************************
     * 読み札画像を保存する
     * @param {Event} event 
     * @return {void}
    ***************************************/
    downloadYomifudaImage(event) {
        // ダウンロード
        const dummyLink = document.createElement('a');
        dummyLink.type     = 'application/octet-stream';
        dummyLink.download = `karuta_yomi_${KarutaGenerator.#getDateTimeString()}.png`;
        dummyLink.href = this.outputKarutaYomifudaImage.src;
        dummyLink.click();
    }

    //---------------------------------------------
    // 描画系メソッド
    //---------------------------------------------

    /***************************************
     * 再描画する
     * @private
     * @param {boolean} redrawEfudaImage 
     * @param {boolean} redrawEfudaFrameAndCircle 
     * @param {boolean} redrawYomifuda 
     * @return {void}
    ***************************************/
    #redraw(redrawEfudaImage, redrawEfudaFrameAndCircle, redrawYomifuda) {
        // 絵札画像部分描画
        if (redrawEfudaImage) {
            // キャンバスをクリア
            this.efudaCtx.clearRect(0, 0, this.efudaCanvas.width, this.efudaCanvas.height);
            this.#drawKarutaEfudaImage();
        }
        // 絵札描画
        if (redrawEfudaFrameAndCircle) {
            this.#drawKarutaEfudaFrameAndCircle();
        }
        // 読み札描画
        if (redrawYomifuda) {
            this.#drawKarutaYomiText();
        }
    }

    /***************************************
     * 絵札の画像部分を描画する
     * @private
     * @return {void}
    ***************************************/
    #drawKarutaEfudaImage() {
        // 背景描画
        this.efudaCtx.fillStyle   = this.efudaBackgroudColor;
        this.efudaCtx.fillRect(0, 0, this.efudaCanvas.width, this.efudaCanvas.height);
        // 画像描画
        const w = this.img.width  * this.scale;
        const h = this.img.height * this.scale;
        this.efudaCtx.drawImage(this.img, this.imgPosX, this.imgPosY, w, h);
    }

    /***************************************
     * 絵札の丸と枠を描画する
     * @private
     * @return {void}
    ***************************************/
    #drawKarutaEfudaFrameAndCircle() {
        // 絵札
        this.efudaCtx.strokeStyle = this.frameColor;
        this.efudaCtx.lineWidth   = 100;
        this.efudaCtx.strokeRect(0, 0, this.efudaCanvas.width, this.efudaCanvas.height);
        // 円描画
        this.efudaCtx.beginPath();
        this.efudaCtx.arc(840, 200, 120, 0 * Math.PI / 180, 360 * Math.PI / 180, false);
        this.efudaCtx.fillStyle = "#FFFFFF" ;
        this.efudaCtx.fill() ;
        this.efudaCtx.strokeStyle = this.frameColor;
        this.efudaCtx.lineWidth   = 20;
        this.efudaCtx.stroke();
        // 文字描画
        this.efudaCtx.fillStyle    = '#000';
        this.efudaCtx.font         = "120px 'Noto Sans JP', sans-serif";
        this.efudaCtx.textAlign    = 'center';
        this.efudaCtx.textBaseline = 'middle';
        this.efudaCtx.fillText(this.efudaText, 840, 200);
    }

    /***************************************
     * 読み札を描画する
     * @private
     * @return {void}
    ***************************************/
    #drawKarutaYomiText() {
        // 読み札
        this.yomifudaCtx.fillStyle = '#FFFFFF';
        this.yomifudaCtx.fillRect(0, 0, this.yomifudaCanvas.width, this.yomifudaCanvas.height);
        this.yomifudaCtx.strokeStyle = this.frameColor;
        this.yomifudaCtx.lineWidth = 100;
        this.yomifudaCtx.strokeRect(0, 0, this.yomifudaCanvas.width, this.yomifudaCanvas.height);
        // 文字描画
        this.yomifudaCtx.fillStyle = '#000000';
        this.yomifudaCtx.font = `${this.yomifudaTextSize}px 'Noto Sans JP', sans-serif`;

        // 座標計算用変数
        let lineCount = 0; // 行数カウント
        let charCount = 0; // 行ごとの文字数カウント
        const paddingTop = this.yomifudaTextSize / 2;
        const offset = (this.yomifudaText.match(/\n/g)?.length ?? 0) / 2;
        const centerCoordinates = this.yomifudaCanvas.width / 2;
        // 正規表現：半角英数記号
        const regexp = new RegExp(/^[a-zA-Z0-9!-/:-@¥[-`{-~]*$/);
        for (let c of this.yomifudaText) {
            if (c === '\n') {
                // 改行コードの場合は行数カウントをインクリメント
                lineCount++;
                // 行が変わるので0にする
                charCount = 0;
                continue;
            }
            if (regexp.test(c)) {
                // 調整
                this.yomifudaCtx.textAlign    = 'center';
                this.yomifudaCtx.textBaseline = 'top';
                // 左上（0,0）を基準に座標計算
                const x = centerCoordinates - (this.yomifudaTextSize * (lineCount - offset));
                const y = paddingTop + (this.yomifudaTextSize * charCount);
                this.yomifudaCtx.fillText(c, x, y)
            } else {
                // 調整
                this.yomifudaCtx.textAlign    = 'left';
                this.yomifudaCtx.textBaseline = 'middle';
                // 日本語縦書き対応
                this.yomifudaCtx.save();
                this.yomifudaCtx.translate(this.yomifudaCanvas.width, 0); // 右上に移動
                this.yomifudaCtx.rotate(Math.PI / 2);
                // 右上（0,0）を基準に座標計算
                const x = paddingTop + (this.yomifudaTextSize * charCount);
                const y = centerCoordinates + (this.yomifudaTextSize * (lineCount - offset));
                this.yomifudaCtx.fillText(c, x, y)
                this.yomifudaCtx.restore();
            }
            charCount++;
        }

    }

    //---------------------------------------------
    // 座標計算系メソッド
    //---------------------------------------------

    /***************************************
     * キャンバス上に表示する画像の座標を計算する
     * @private
     * @return {void}
    ***************************************/
    #calculateImagePos() {
        this.imgPosX = Math.floor((this.efudaCanvas.width  - this.img.width  * this.scale) / 2) + Math.floor(this.moveX);
        this.imgPosY = Math.floor((this.efudaCanvas.height - this.img.height * this.scale) / 2) + Math.floor(this.moveY);
    }

    /***************************************
     * 各種値リセット（スケール、横位置、縦位置）
     * @private
     * @return {void}
    ***************************************/
    #reset() {
        // 枠色・テキストはリセットしない
        this.scale = 1;
        this.moveX = 0;
        this.moveY = 0;
        this.zoomSlider.value = 1;
        this.xPosSlider.value = 0;
        this.yPosSlider.value = 0;
        this.outputKarutaEfudaImage.style = 'display: none;';
        this.outputKarutaEfudaImage.src   = '';
        this.outputKarutaYomifudaImage.style = 'display: none;';
        this.outputKarutaYomifudaImage.src   = '';
    }
    
    //---------------------------------------------
    // その他メソッド
    //---------------------------------------------

    /***************************************
     * 現在日時をYYYYMMDDhhmiss形式で取得する
     * @private
     * @return {string}
    ***************************************/
    static #getDateTimeString() {
        return new Date().toLocaleString(
            "ja-JP",
            {
                year:   "numeric",
                month:  "2-digit",
                day:    "2-digit",
                hour12: false,
                hour:   "2-digit",
                minute: "2-digit",
                second: "2-digit"
            }
        ).replace(/[\/:\s]/g, '');
    }
}

const karutaGenerator = new KarutaGenerator();
karutaGenerator.initialize();


document.addEventListener('DOMContentLoaded', () => {
    window.addEventListener('scroll', () => {
        const floatButton = document.querySelector('.float-button-wrap');
        if (this.scrollY <= 10) {
            floatButton.classList.remove('show');
            return;
        }
        floatButton.classList.add('show');

        const scrollHeight = document.documentElement.scrollHeight;// ページ全体の高さ
        const scrollPosition = this.innerHeight + this.scrollY;// ページの一番上からスクロールされた距離
        const footerHeight = document.querySelector("footer").clientHeight;// フッターの高さ

        if (scrollHeight - scrollPosition <= footerHeight) {
            floatButton.style.position = 'absolute';
        } else {
            floatButton.style.position = 'fixed';
        }

    });
});
