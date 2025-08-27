import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { BarcodeFormat } from '@zxing/library';
import { QRScannerDialogComponent } from './qr-scanner-dialog.component';

describe('QRScannerDialogComponent', () => {
  let component: QRScannerDialogComponent;
  let fixture: ComponentFixture<QRScannerDialogComponent>;
  let mockDialogRef: jasmine.SpyObj<MatDialogRef<QRScannerDialogComponent>>;

  const mockDialogData = {
    availableDevices: [
      { deviceId: 'device1', kind: 'videoinput', label: 'Back Camera', groupId: 'group1' } as MediaDeviceInfo,
      { deviceId: 'device2', kind: 'videoinput', label: 'Front Camera', groupId: 'group1' } as MediaDeviceInfo
    ],
    currentDevice: { deviceId: 'device1', kind: 'videoinput', label: 'Back Camera', groupId: 'group1' } as MediaDeviceInfo,
    formats: [BarcodeFormat.QR_CODE]
  };

  beforeEach(async () => {
    mockDialogRef = jasmine.createSpyObj('MatDialogRef', ['close']);

    await TestBed.configureTestingModule({
      imports: [QRScannerDialogComponent],
      providers: [
        { provide: MatDialogRef, useValue: mockDialogRef },
        { provide: MAT_DIALOG_DATA, useValue: mockDialogData }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(QRScannerDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should initialize with provided data', () => {
    expect(component.availableDevices).toEqual(mockDialogData.availableDevices);
    expect(component.currentDevice).toEqual(mockDialogData.currentDevice);
    expect(component.formats).toEqual(mockDialogData.formats);
    expect(component.hasDevices).toBe(true);
    expect(component.scannerEnabled).toBe(true);
  });

  it('should handle scan success with valid code', () => {
    const testCode = 'ABC123'; // Valid session code format
    spyOn(component, 'confirm');

    component.onScanSuccess(testCode);

    expect(component.lastScannedCode).toBe(testCode);
    expect(component.confirm).toHaveBeenCalled();
  });

  it('should not auto-confirm invalid session codes', () => {
    const testCode = 'invalid-code'; // Invalid format
    spyOn(component, 'confirm');

    component.onScanSuccess(testCode);

    expect(component.lastScannedCode).toBe(testCode);
    expect(component.confirm).not.toHaveBeenCalled();
  });

  it('should validate session codes correctly', () => {
    expect(component['isValidSessionCode']('ABC123')).toBe(true);
    expect(component['isValidSessionCode']('ABCD1234')).toBe(true);
    expect(component['isValidSessionCode']('abc123')).toBe(false);
    expect(component['isValidSessionCode']('ABC')).toBe(false);
    expect(component['isValidSessionCode']('ABCDEFGHIJK')).toBe(false);
  });

  it('should validate URLs with session codes', () => {
    const validUrl = 'https://example.com/join?code=ABC123';
    const invalidUrl = 'https://example.com/join?code=invalid';

    expect(component['isValidSessionCode'](validUrl)).toBe(true);
    expect(component['isValidSessionCode'](invalidUrl)).toBe(false);
  });

  it('should handle cameras found', () => {
    const devices = [
      { deviceId: 'device3', kind: 'videoinput', label: 'Camera 3', groupId: 'group1' } as MediaDeviceInfo
    ];

    component.onCamerasFound(devices);

    expect(component.availableDevices).toEqual(devices);
    expect(component.hasDevices).toBe(true);
    expect(component.currentDevice).toEqual(devices[0]);
  });

  it('should prefer back camera when multiple devices found', () => {
    const devices = [
      { deviceId: 'front', kind: 'videoinput', label: 'Front Camera', groupId: 'group1' } as MediaDeviceInfo,
      { deviceId: 'back', kind: 'videoinput', label: 'Back Camera', groupId: 'group1' } as MediaDeviceInfo
    ];

    component.currentDevice = undefined;
    component.onCamerasFound(devices);

    expect(component.currentDevice).toBeTruthy();
    expect(component.availableDevices).toEqual(devices);
  });

  it('should handle permission response', () => {
    component.onPermissionResponse(true);
    expect(component.hasPermission).toBe(true);

    component.onPermissionResponse(false);
    expect(component.hasPermission).toBe(false);
  });

  it('should handle device selection change', () => {
    const newDevice = { deviceId: 'device2', kind: 'videoinput', label: 'Front Camera', groupId: 'group1' } as MediaDeviceInfo;
    
    component.onDeviceSelectChange(newDevice);

    expect(component.currentDevice).toEqual(newDevice);
    expect(component.scannerEnabled).toBe(false);

    // Should re-enable scanner after timeout
    setTimeout(() => {
      expect(component.scannerEnabled).toBe(true);
    }, 150);
  });

  it('should close dialog when close is called', () => {
    component.close();
    expect(mockDialogRef.close).toHaveBeenCalled();
  });

  it('should close dialog with result when confirm is called', () => {
    const testCode = 'ABC123';
    component.lastScannedCode = testCode;

    component.confirm();

    expect(mockDialogRef.close).toHaveBeenCalledWith(testCode);
  });

  it('should handle request permission', async () => {
    // Mock getUserMedia
    const mockGetUserMedia = jasmine.createSpy('getUserMedia').and.returnValue(
      Promise.resolve({
        getTracks: () => [{ stop: jasmine.createSpy('stop') }]
      })
    );
    Object.defineProperty(navigator, 'mediaDevices', {
      value: { getUserMedia: mockGetUserMedia },
      writable: true
    });

    await component.requestPermission();

    expect(mockGetUserMedia).toHaveBeenCalledWith({ video: true });
    expect(component.hasPermission).toBe(true);
    expect(component.scannerEnabled).toBe(true);
  });

  it('should handle permission request failure', async () => {
    const mockGetUserMedia = jasmine.createSpy('getUserMedia').and.returnValue(
      Promise.reject(new Error('Permission denied'))
    );
    Object.defineProperty(navigator, 'mediaDevices', {
      value: { getUserMedia: mockGetUserMedia },
      writable: true
    });

    await component.requestPermission();

    expect(component.hasPermission).toBe(false);
  });

  it('should disable scanner on destroy', () => {
    component.scannerEnabled = true;
    component.ngOnDestroy();
    expect(component.scannerEnabled).toBe(false);
  });
});