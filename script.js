class ReceiptManager {
    constructor() {
        this.video = document.getElementById('camera');
        this.canvas = document.getElementById('canvas');
        this.ctx = this.canvas.getContext('2d');
        this.startCameraBtn = document.getElementById('start-camera');
        this.captureBtn = document.getElementById('capture-photo');
        this.receiptsList = document.getElementById('receipts-list');
        
        this.receipts = this.loadReceipts();
        this.init();
    }
    
    init() {
        this.startCameraBtn.addEventListener('click', () => this.startCamera());
        this.captureBtn.addEventListener('click', () => this.capturePhoto());
        
        // スマホ向けタッチイベント
        this.startCameraBtn.addEventListener('touchstart', (e) => e.preventDefault());
        this.captureBtn.addEventListener('touchstart', (e) => e.preventDefault());
        
        // 画面回転対応
        window.addEventListener('orientationchange', () => {
            setTimeout(() => this.handleOrientationChange(), 500);
        });
        
        this.displayReceipts();
    }
    
    async startCamera() {
        try {
            // スマホ向けカメラ設定を最適化
            const constraints = {
                video: {
                    facingMode: { ideal: 'environment' },
                    width: { 
                        min: 640,
                        ideal: window.innerWidth > 768 ? 1280 : 800,
                        max: 1920
                    },
                    height: { 
                        min: 480,
                        ideal: window.innerWidth > 768 ? 720 : 600,
                        max: 1080
                    }
                }
            };
            
            const stream = await navigator.mediaDevices.getUserMedia(constraints);
            
            this.video.srcObject = stream;
            this.video.style.display = 'block';
            this.startCameraBtn.style.display = 'none';
            this.captureBtn.style.display = 'block';
            
            // スマホでフルスクリーン風に
            if (window.innerWidth <= 768) {
                this.video.style.width = '100%';
                this.video.style.maxWidth = 'none';
            }
            
        } catch (error) {
            console.error('カメラのアクセスに失敗しました:', error);
            this.showCameraError(error);
        }
    }
    
    capturePhoto() {
        const videoWidth = this.video.videoWidth;
        const videoHeight = this.video.videoHeight;
        
        this.canvas.width = videoWidth;
        this.canvas.height = videoHeight;
        
        this.ctx.drawImage(this.video, 0, 0, videoWidth, videoHeight);
        
        const imageData = this.canvas.toDataURL('image/jpeg', 0.8);
        
        const receipt = {
            id: Date.now(),
            image: imageData,
            date: new Date().toLocaleDateString('ja-JP'),
            timestamp: new Date().toISOString()
        };
        
        this.receipts.push(receipt);
        this.saveReceipts();
        this.displayReceipts();
        
        this.stopCamera();
        this.showSuccessMessage('レシートを保存しました！');
    }
    
    stopCamera() {
        if (this.video.srcObject) {
            const tracks = this.video.srcObject.getTracks();
            tracks.forEach(track => track.stop());
            this.video.srcObject = null;
        }
        
        this.video.style.display = 'none';
        this.video.style.width = '';
        this.video.style.maxWidth = '';
        this.startCameraBtn.style.display = 'block';
        this.captureBtn.style.display = 'none';
    }
    
    displayReceipts() {
        this.receiptsList.innerHTML = '';
        
        if (this.receipts.length === 0) {
            this.receiptsList.innerHTML = '<p class="no-receipts">まだレシートが保存されていません</p>';
            return;
        }
        
        this.receipts.reverse().forEach(receipt => {
            const receiptElement = document.createElement('div');
            receiptElement.className = 'receipt-item';
            receiptElement.innerHTML = `
                <img src="${receipt.image}" alt="レシート" class="receipt-image">
                <div class="receipt-info">
                    <p class="receipt-date">${receipt.date}</p>
                    <button class="delete-btn" onclick="receiptManager.deleteReceipt(${receipt.id})">削除</button>
                </div>
            `;
            
            const receiptImage = receiptElement.querySelector('.receipt-image');
            receiptImage.addEventListener('click', () => {
                this.showFullImage(receipt.image);
            });
            
            // スマホ向けタッチフィードバック
            receiptImage.addEventListener('touchstart', (e) => {
                receiptImage.style.opacity = '0.7';
            });
            receiptImage.addEventListener('touchend', (e) => {
                setTimeout(() => receiptImage.style.opacity = '1', 150);
            });
            
            this.receiptsList.appendChild(receiptElement);
        });
    }
    
    showFullImage(imageSrc) {
        const modal = document.createElement('div');
        modal.className = 'modal';
        modal.innerHTML = `
            <div class="modal-content">
                <span class="close">&times;</span>
                <img src="${imageSrc}" alt="レシート拡大" class="modal-image">
            </div>
        `;
        
        document.body.appendChild(modal);
        
        modal.querySelector('.close').addEventListener('click', () => {
            document.body.removeChild(modal);
        });
        
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                document.body.removeChild(modal);
            }
        });
        
        // スマホ向けスワイプで閉じる
        let startY = 0;
        modal.addEventListener('touchstart', (e) => {
            startY = e.touches[0].clientY;
        });
        modal.addEventListener('touchmove', (e) => {
            const currentY = e.touches[0].clientY;
            const diff = startY - currentY;
            if (Math.abs(diff) > 100) {
                document.body.removeChild(modal);
            }
        });
    }
    
    deleteReceipt(id) {
        if (confirm('このレシートを削除しますか？')) {
            this.receipts = this.receipts.filter(receipt => receipt.id !== id);
            this.saveReceipts();
            this.displayReceipts();
        }
    }
    
    saveReceipts() {
        localStorage.setItem('receipts', JSON.stringify(this.receipts));
    }
    
    loadReceipts() {
        const saved = localStorage.getItem('receipts');
        return saved ? JSON.parse(saved) : [];
    }
    
    // スマホ向け追加メソッド
    handleOrientationChange() {
        if (this.video.srcObject) {
            // カメラが起動中の場合、画面回転に合わせて調整
            if (window.innerWidth <= 768) {
                this.video.style.width = '100%';
                this.video.style.maxWidth = 'none';
            } else {
                this.video.style.width = '';
                this.video.style.maxWidth = '500px';
            }
        }
    }
    
    showCameraError(error) {
        let message = 'カメラにアクセスできません。';
        if (error.name === 'NotAllowedError') {
            message += '\nカメラの使用を許可してください。';
        } else if (error.name === 'NotFoundError') {
            message += '\nカメラが見つかりません。';
        } else {
            message += '\nブラウザの設定を確認してください。';
        }
        alert(message);
    }
    
    showSuccessMessage(text) {
        // スマホ向けの短時間表示メッセージ
        const toast = document.createElement('div');
        toast.style.cssText = `
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            background: #2ecc71;
            color: white;
            padding: 15px 25px;
            border-radius: 8px;
            font-size: 16px;
            z-index: 2000;
            box-shadow: 0 4px 12px rgba(0,0,0,0.3);
        `;
        toast.textContent = text;
        
        document.body.appendChild(toast);
        
        setTimeout(() => {
            if (document.body.contains(toast)) {
                document.body.removeChild(toast);
            }
        }, 2000);
    }
}

const receiptManager = new ReceiptManager();