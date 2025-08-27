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
  template: `
    <div class="qr-scanner-dialog">
      <div class="dialog-header">
        <h2 mat-dialog-title>Scan QR Code</h2>
        <button mat-icon-button (click)="close()" aria-label="Close scanner">
          <mat-icon>close</mat-icon>
        </button>
      </div>

      <div class="dialog-content" mat-dialog-content>
        @if (hasDevices && hasPermission) {
          <div class="scanner-container">
            <zxing-scanner
              #scanner
              [enable]="scannerEnabled"
              [device]="currentDevice"
              [formats]="formats"
              (scanSuccess)="onScanSuccess($event)"
              (scanFailure)="onScanError($event)"
              (camerasFound)="onCamerasFound($event)"
              (camerasNotFound)="onCamerasNotFound()"
              (permissionResponse)="onPermissionResponse($event)"
              (hasDevices)="onHasDevices($event)">
            </zxing-scanner>
            
            <div class="scanner-overlay">
              <div class="scanner-frame"></div>
              <p class="scanner-instruction">Position the QR code within the frame</p>
            </div>
          </div>

          @if (availableDevices.length > 1) {
            <div class="camera-selector">
              <mat-label>Camera:</mat-label>
              <mat-select 
                [value]="currentDevice" 
                (selectionChange)="onDeviceSelectChange($event.value)">
                @for (device of availableDevices; track device.deviceId) {
                  <mat-option [value]="device">
                    {{ device.label || 'Camera ' + ($index + 1) }}
                  </mat-option>
                }
              </mat-select>
            </div>
          }
        } @else if (!hasPermission) {
          <div class="permission-request">
            <mat-icon class="permission-icon">camera_alt</mat-icon>
            <h3>Camera Permission Required</h3>
            <p>Please allow camera access to scan QR codes</p>
            <button mat-raised-button color="primary" (click)="requestPermission()">
              Allow Camera Access
            </button>
          </div>
        } @else if (!hasDevices) {
          <div class="no-devices">
            <mat-icon class="no-camera-icon">camera_alt_off</mat-icon>
            <h3>No Camera Found</h3>
            <p>No camera devices were detected on this device</p>
          </div>
        } @else {
          <div class="loading">
            <mat-spinner diameter="50"></mat-spinner>
            <p>Initializing camera...</p>
          </div>
        }
      </div>

      <div class="dialog-actions" mat-dialog-actions>
        <button mat-button (click)="close()">Cancel</button>
        @if (lastScannedCode) {
          <button mat-raised-button color="primary" (click)="confirm()">
            Use: {{ lastScannedCode }}
          </button>
        }
      </div>
    </div>
  `,
  styles: [`
    .qr-scanner-dialog {
      display: flex;
      flex-direction: column;
      height: 100%;
      max-height: 70vh;
    }

    .dialog-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 16px;
      border-bottom: 1px solid #e0e0e0;
    }

    .dialog-header h2 {
      margin: 0;
      font-size: 1.2rem;
    }

    .dialog-content {
      flex: 1;
      padding: 16px;
      display: flex;
      flex-direction: column;
      gap: 16px;
      overflow: hidden;
    }

    .scanner-container {
      position: relative;
      flex: 1;
      min-height: 250px;
      background: #000;
      border-radius: 8px;
      overflow: hidden;
    }

    zxing-scanner {
      width: 100%;
      height: 100%;
    }

    .scanner-overlay {
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      display: flex;
      flex-direction: column;
      justify-content: center;
      align-items: center;
      pointer-events: none;
    }

    .scanner-frame {
      width: 200px;
      height: 200px;
      border: 2px solid #fff;
      border-radius: 8px;
      position: relative;
    }

    .scanner-frame::before,
    .scanner-frame::after {
      content: '';
      position: absolute;
      width: 20px;
      height: 20px;
      border: 3px solid #4caf50;
    }

    .scanner-frame::before {
      top: -3px;
      left: -3px;
      border-right: none;
      border-bottom: none;
    }

    .scanner-frame::after {
      bottom: -3px;
      right: -3px;
      border-left: none;
      border-top: none;
    }

    .scanner-instruction {
      color: #fff;
      text-align: center;
      margin-top: 16px;
      font-size: 0.9rem;
      text-shadow: 0 1px 3px rgba(0,0,0,0.7);
    }

    .camera-selector {
      display: flex;
      align-items: center;
      gap: 12px;
    }

    .camera-selector mat-label {
      font-weight: 500;
      min-width: 60px;
    }

    .camera-selector mat-select {
      flex: 1;
    }

    .permission-request,
    .no-devices,
    .loading {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      text-align: center;
      padding: 32px;
      flex: 1;
    }

    .permission-icon,
    .no-camera-icon {
      font-size: 64px;
      width: 64px;
      height: 64px;
      color: #666;
      margin-bottom: 16px;
    }

    .permission-request h3,
    .no-devices h3 {
      margin: 0 0 8px 0;
      color: #333;
    }

    .permission-request p,
    .no-devices p {
      margin: 0 0 24px 0;
      color: #666;
    }

    .loading {
      gap: 16px;
    }

    .loading p {
      margin: 0;
      color: #666;
    }

    .dialog-actions {
      padding: 16px;
      border-top: 1px solid #e0e0e0;
      display: flex;
      justify-content: space-between;
      gap: 8px;
    }

    @media (max-width: 480px) {
      .scanner-frame {
        width: 160px;
        height: 160px;
      }
      
      .scanner-instruction {
        font-size: 0.8rem;
      }
      
      .dialog-content {
        padding: 12px;
      }
      
      .dialog-header,
      .dialog-actions {
        padding: 12px;
      }
    }
  `]
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