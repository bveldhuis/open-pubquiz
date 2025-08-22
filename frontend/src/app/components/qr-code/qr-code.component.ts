import { Component, Input, Output, EventEmitter, OnInit, OnDestroy, ElementRef, ViewChild } from '@angular/core';
import * as QRCode from 'qrcode';

@Component({
  selector: 'app-qr-code',
  templateUrl: './qr-code.component.html',
  styleUrls: ['./qr-code.component.scss']
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
