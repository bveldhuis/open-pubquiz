import { Component, Input, Output, EventEmitter, OnInit, OnDestroy, ElementRef, ViewChild } from '@angular/core';
import * as QRCode from 'qrcode';

@Component({
  selector: 'app-qr-code',
  template: `
    <div class="qr-code-container">
      <div class="qr-header">
        <h3>Join Session</h3>
        <p>Scan this QR code with your phone to join the quiz session</p>
      </div>
      
      <div class="qr-content">
        <div class="qr-code-wrapper">
          <canvas #qrCanvas class="qr-canvas"></canvas>
          <div class="qr-overlay" *ngIf="isGenerating">
            <mat-spinner diameter="40"></mat-spinner>
            <span>Generating QR Code...</span>
          </div>
        </div>
        
        <div class="session-info">
          <div class="session-code">
            <span class="code-label">Session Code:</span>
            <span class="code-value">{{ sessionCode }}</span>
          </div>
          
          <div class="join-url">
            <span class="url-label">Or visit:</span>
            <a [href]="joinUrl" target="_blank" class="url-link">{{ joinUrl }}</a>
          </div>
        </div>
      </div>
      
      <div class="qr-actions">
        <button mat-raised-button color="primary" (click)="downloadQR()" [disabled]="!qrCodeGenerated">
          <mat-icon>download</mat-icon>
          Download QR Code
        </button>
        
        <button mat-stroked-button (click)="copyUrl()" [disabled]="!qrCodeGenerated">
          <mat-icon>content_copy</mat-icon>
          Copy URL
        </button>
        
        <button mat-stroked-button (click)="shareUrl()" [disabled]="!qrCodeGenerated">
          <mat-icon>share</mat-icon>
          Share
        </button>
      </div>
      
      <div class="qr-instructions">
        <h4>How to join:</h4>
        <ol>
          <li>Open your phone's camera app</li>
          <li>Point it at the QR code above</li>
          <li>Tap the notification that appears</li>
          <li>Enter your team name and start playing!</li>
        </ol>
      </div>
    </div>
  `,
  styles: [`
    .qr-code-container {
      max-width: 500px;
      margin: 0 auto;
      padding: 20px;
      text-align: center;
    }

    .qr-header h3 {
      margin: 0 0 8px 0;
      color: #333;
      font-size: 1.5rem;
    }

    .qr-header p {
      margin: 0 0 24px 0;
      color: #666;
      font-size: 1rem;
    }

    .qr-content {
      background: white;
      border-radius: 12px;
      padding: 24px;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
      margin-bottom: 20px;
    }

    .qr-code-wrapper {
      position: relative;
      display: inline-block;
      margin-bottom: 20px;
    }

    .qr-canvas {
      border: 2px solid #e0e0e0;
      border-radius: 8px;
      background: white;
    }

    .qr-overlay {
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: rgba(255, 255, 255, 0.9);
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      border-radius: 8px;
      gap: 8px;
    }

    .qr-overlay span {
      font-size: 0.9rem;
      color: #666;
    }

    .session-info {
      text-align: center;
    }

    .session-code {
      margin-bottom: 16px;
    }

    .code-label {
      display: block;
      font-size: 0.9rem;
      color: #666;
      margin-bottom: 4px;
    }

    .code-value {
      display: block;
      font-size: 2rem;
      font-weight: bold;
      color: #2196f3;
      letter-spacing: 4px;
      font-family: 'Courier New', monospace;
    }

    .join-url {
      margin-bottom: 16px;
    }

    .url-label {
      display: block;
      font-size: 0.9rem;
      color: #666;
      margin-bottom: 4px;
    }

    .url-link {
      display: block;
      color: #2196f3;
      text-decoration: none;
      font-size: 0.9rem;
      word-break: break-all;
      padding: 8px;
      background: #f5f5f5;
      border-radius: 4px;
      border: 1px solid #e0e0e0;
    }

    .url-link:hover {
      background: #e3f2fd;
      text-decoration: underline;
    }

    .qr-actions {
      display: flex;
      gap: 12px;
      justify-content: center;
      flex-wrap: wrap;
      margin-bottom: 20px;
    }

    .qr-actions button {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 12px 20px;
      font-weight: 500;
    }

    .qr-instructions {
      background: #f8f9fa;
      border-radius: 8px;
      padding: 20px;
      text-align: left;
    }

    .qr-instructions h4 {
      margin: 0 0 12px 0;
      color: #333;
      font-size: 1.1rem;
    }

    .qr-instructions ol {
      margin: 0;
      padding-left: 20px;
    }

    .qr-instructions li {
      margin-bottom: 8px;
      color: #555;
      line-height: 1.4;
    }

    .qr-instructions li:last-child {
      margin-bottom: 0;
    }

    @media (max-width: 768px) {
      .qr-code-container {
        padding: 16px;
      }

      .qr-content {
        padding: 20px;
      }

      .code-value {
        font-size: 1.5rem;
        letter-spacing: 2px;
      }

      .qr-actions {
        flex-direction: column;
      }

      .qr-actions button {
        width: 100%;
        justify-content: center;
      }
    }
  `]
})
export class QrCodeComponent implements OnInit, OnDestroy {
  @Input() sessionCode: string = '';
  @Input() sessionName: string = '';
  
  @Output() qrGenerated = new EventEmitter<string>();
  @Output() error = new EventEmitter<string>();

  @ViewChild('qrCanvas', { static: true }) qrCanvas!: ElementRef<HTMLCanvasElement>;

  isGenerating = false;
  qrCodeGenerated = false;
  joinUrl = '';

  ngOnInit(): void {
    if (this.sessionCode) {
      this.generateQRCode();
    }
  }

  ngOnDestroy(): void {
    // Cleanup if needed
  }

  generateQRCode(): void {
    if (!this.sessionCode) {
      this.error.emit('No session code provided');
      return;
    }

    this.isGenerating = true;
    this.qrCodeGenerated = false;

    // Create the join URL
    this.joinUrl = `${window.location.origin}/join?code=${this.sessionCode}`;

    // Generate QR code
    QRCode.toCanvas(this.qrCanvas.nativeElement, this.joinUrl, {
      width: 256,
      margin: 2,
      color: {
        dark: '#000000',
        light: '#FFFFFF'
      }
    })
    .then(() => {
      this.isGenerating = false;
      this.qrCodeGenerated = true;
      this.qrGenerated.emit(this.joinUrl);
    })
    .catch((err) => {
      this.isGenerating = false;
      console.error('Error generating QR code:', err);
      this.error.emit('Failed to generate QR code');
    });
  }

  downloadQR(): void {
    if (!this.qrCodeGenerated) return;

    const canvas = this.qrCanvas.nativeElement;
    const link = document.createElement('a');
    link.download = `quiz-session-${this.sessionCode}.png`;
    link.href = canvas.toDataURL();
    link.click();
  }

  copyUrl(): void {
    if (!this.qrCodeGenerated) return;

    navigator.clipboard.writeText(this.joinUrl).then(() => {
      // Could emit an event or show a snackbar here
      console.log('URL copied to clipboard');
    }).catch((err) => {
      console.error('Failed to copy URL:', err);
      this.error.emit('Failed to copy URL to clipboard');
    });
  }

  shareUrl(): void {
    if (!this.qrCodeGenerated) return;

    if (navigator.share) {
      navigator.share({
        title: `Join Quiz Session: ${this.sessionName}`,
        text: `Join our quiz session with code: ${this.sessionCode}`,
        url: this.joinUrl
      }).catch((err) => {
        console.error('Error sharing:', err);
        this.copyUrl(); // Fallback to copying URL
      });
    } else {
      this.copyUrl(); // Fallback for browsers that don't support Web Share API
    }
  }

  // Method to refresh QR code if session code changes
  refreshQRCode(): void {
    this.generateQRCode();
  }
}
