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
        this.efudaBackgroudColor = '#FFF';
        // 絵札の文字
        this.efudaText = '';
        // 読み札の文字
        this.yomifudaText = '';
        this.yomifudaTextSize = 120;
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
        const imgSaveButton = document.getElementById('imageSaveButton');
        const event = window.ontouchstart === undefined ? 'click' : 'touchstart';
        imgSaveButton.addEventListener(event, this.downloadImage.bind(this));

        this.outputKarutaEfudaImage = document.getElementById('outputKarutaEfudaImage');
        this.outputKarutaEfudaImage.style = 'display: none;';

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
        this.efudaText = event.target.value;
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
        this.yomifudaText = event.target.value;
        // 再描画
        this.#redraw(false, false, true);
    }

    /***************************************
     * 画像を保存する
     * @param {Event} event 
     * @return {void}
    ***************************************/
    downloadImage(event) {
        // img要素に表示
        const efudaImgUrl = this.efudaCanvas.toDataURL('image/png');
        this.outputKarutaEfudaImage.src = efudaImgUrl;
        this.outputKarutaEfudaImage.style = '';
        const yomifudaImgUrl = this.yomifudaCanvas.toDataURL('image/png');
        this.outputKarutaYomifudaImage.src = yomifudaImgUrl;
        this.outputKarutaYomifudaImage.style = '';

        // ダウンロード
        const dummyLink = document.createElement('a');
        dummyLink.type     = 'application/octet-stream';
        dummyLink.download = `karuta_e_${KarutaGenerator.#getDateTimeString()}.png`;
        dummyLink.href = efudaImgUrl;
        dummyLink.click();
        dummyLink.download = `karuta_yomi_${KarutaGenerator.#getDateTimeString()}.png`;
        dummyLink.href = yomifudaImgUrl;
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
        this.efudaCtx.fillStyle = "#FFF" ;
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
        this.yomifudaCtx.fillStyle   = '#FFF';
        this.yomifudaCtx.fillRect(0, 0, this.yomifudaCanvas.width, this.yomifudaCanvas.height);
        this.yomifudaCtx.strokeStyle = this.frameColor;
        this.yomifudaCtx.lineWidth   = 100;
        this.yomifudaCtx.strokeRect(0, 0, this.yomifudaCanvas.width, this.yomifudaCanvas.height);
        // 文字描画
        this.yomifudaCtx.fillStyle    = '#000';
        this.yomifudaCtx.font         = `${this.yomifudaTextSize}px 'Noto Sans JP', sans-serif`;
        this.yomifudaCtx.textAlign    = 'center';
        this.yomifudaCtx.textBaseline = 'middle';
        let txtPosX = 840;
        let txtPosY = 200;
        for (let c of this.yomifudaText) {
            if (c === '\n') {
                 // X座標を1行分左、Y座標を初期値
                txtPosX -= this.yomifudaTextSize;
                txtPosY = 200;
                continue;
            }
            this.yomifudaCtx.fillText(c, txtPosX, txtPosY);
            txtPosY += this.yomifudaTextSize;
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