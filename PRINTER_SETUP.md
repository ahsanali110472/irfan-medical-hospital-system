# USB Thermal Printer Setup Guide

## Overview
This guide helps you set up USB thermal printer support for the Irfan Medical Center billing system.

## Prerequisites
1. **USB Thermal Printer** connected to your computer
2. **Windows 10/11** with administrator privileges
3. **Node.js** and **npm** installed

## Installation Steps

### 1. Install Dependencies
The required packages are already included in package.json:
- `escpos`: ESC/POS command library
- `escpos-usb`: USB interface for thermal printers
- `usb`: USB device access

### 2. Install USB Drivers
Most thermal printers use standard USB drivers, but some may require specific drivers:
- Check your printer manufacturer's website for Windows drivers
- Common thermal printer brands: Epson, Star, Bixolon, etc.

### 3. Test Printer Connection
Run the test script to verify printer detection:
```bash
node test-printer.js
```

### 4. Common USB Vendor/Product IDs
The system tries these common thermal printer IDs:
- **0x0FE6:0x811E** - Generic thermal printers
- **0x0456:0x0808** - Alternative ID

### 5. Troubleshooting

#### "No printers found" error:
1. Ensure printer is powered on and connected via USB
2. Check Windows Device Manager for printer recognition
3. Try different USB ports
4. Install manufacturer drivers if needed

#### "usb.on is not a function" error:
This indicates the USB module isn't properly initialized. The fix includes:
- Proper error handling in printer initialization
- Fallback to alternative printer IDs
- Better error messages for debugging

#### Permission issues:
1. Run the application as administrator
2. Check Windows USB device permissions
3. Ensure no other applications are using the printer

### 6. Printer Configuration
The system automatically detects and configures the printer. No manual configuration is required.

### 7. Testing Print Functionality
1. Create a test bill in the system
2. Mark it as paid
3. Click the "Print" button
4. The receipt should print automatically

## Error Handling
The system includes comprehensive error handling:
- Detects when printer is not connected
- Provides clear error messages
- Falls back to browser printing if USB fails
