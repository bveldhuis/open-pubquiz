import { Component, Inject, OnDestroy, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSelectModule } from '@angular/material/select';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { ZXingScannerComponent, ZXingScannerModule } from '@zxing/ngx-scanner';
import { BarcodeFormat, Result } from '@zxing/library';

interface QRScannerDialogData {
  availableDevices: MediaDeviceInfo[];
  currentDevice: MediaDeviceInfo;
  formats: BarcodeFormat[];
}

@Component({
  selector: 'app-qr-scanner-dialog',
  standalone: true,
  imports: [
    CommonModule,
    MatDialogModule,
    MatButtonModule,
    MatIconModule,
    MatSelectModule,
    MatProgressSpinnerModule,
    ZXingScannerModule
  ],
  templateUrl: './qr-scanner-dialog.component.html',
  styleUrls: ['./qr-scanner-dialog.component.scss']
})
export class QRScannerDialogComponent implements OnDestroy {
  @ViewChild('scanner') scanner!: ZXingScannerComponent;

  availableDevices: MediaDeviceInfo[] = [];
  currentDevice: MediaDeviceInfo | undefined;
  formats: BarcodeFormat[] = [];
  hasDevices = false;
  hasPermission = false;
  scannerEnabled = false;
  lastScannedCode: string | null = null;

  constructor(
    public dialogRef: MatDialogRef<QRScannerDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: QRScannerDialogData
  ) {
    this.availableDevices = data.availableDevices;
    this.currentDevice = data.currentDevice;
    this.formats = data.formats;
    this.hasDevices = this.availableDevices.length > 0;
    this.scannerEnabled = true;
  }

  ngOnDestroy(): void {
    this.scannerEnabled = false;
  }

  onScanSuccess(resultString: string): void {
    console.log('QR Code scanned:', resultString);
    this.lastScannedCode = resultString;
    
    // Auto-confirm for session codes that look valid
    if (this.isValidSessionCode(resultString)) {
      this.confirm();
    }
  }

  onScanError(error: any): void {
    console.error('QR scan error:', error);
  }

  onCamerasFound(devices: MediaDeviceInfo[]): void {
    this.availableDevices = devices;
    this.hasDevices = devices.length > 0;
    
    if (!this.currentDevice && this.hasDevices) {
      // Prefer back camera
      this.currentDevice = devices.find(device => 
        device.label.toLowerCase().includes('back') || 
        device.label.toLowerCase().includes('rear')
      ) || devices[0];
    }
  }

  onCamerasNotFound(): void {
    this.hasDevices = false;
    console.warn('No cameras found');
  }

  onPermissionResponse(hasPermission: boolean): void {
    this.hasPermission = hasPermission;
    if (!hasPermission) {
      console.warn('Camera permission denied');
    }
  }

  onHasDevices(hasDevices: boolean): void {
    this.hasDevices = hasDevices;
  }

  onDeviceSelectChange(device: MediaDeviceInfo): void {
    this.currentDevice = device;
    this.scannerEnabled = false;
    
    // Re-enable scanner with new device
    setTimeout(() => {
      this.scannerEnabled = true;
    }, 100);
  }

  async requestPermission(): Promise<void> {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      stream.getTracks().forEach(track => track.stop());
      this.hasPermission = true;
      this.scannerEnabled = true;
    } catch (error) {
      console.error('Permission request failed:', error);
    }
  }

  private isValidSessionCode(text: string): boolean {
    // Check if it's a direct session code
    if (text.match(/^[A-Z0-9]{4,10}$/)) {
      return true;
    }
    
    // Check if it's a URL with session code
    try {
      const url = new URL(text);
      const sessionCode = url.searchParams.get('code') || url.searchParams.get('session');
      return Boolean(sessionCode && sessionCode.match(/^[A-Z0-9]{4,10}$/));
    } catch {
      return false;
    }
  }

  confirm(): void {
    if (this.lastScannedCode) {
      this.dialogRef.close(this.lastScannedCode);
    }
  }

  close(): void {
    this.dialogRef.close();
  }
}