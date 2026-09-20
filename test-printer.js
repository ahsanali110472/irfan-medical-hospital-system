const escpos = require('escpos');
const USB = require('escpos-usb');

console.log('Testing USB thermal printer connection...');

async function testPrinter() {
  try {
    console.log('Available printers:');
    const printers = await USB.findPrinter();
    console.log('Found printers:', printers.length);
    
    if (printers.length === 0) {
      console.log('No USB printers found. Make sure your thermal printer is connected.');
      return;
    }

    // Try to initialize printer
    console.log('Attempting to initialize printer...');
    const device = new USB(printers[0].deviceDescriptor.idVendor, printers[0].deviceDescriptor.idProduct);
    const printer = new escpos.Printer(device);

    device.open((error) => {
      if (error) {
        console.error('Failed to open printer device:', error);
        return;
      }

      console.log('Printer opened successfully!');
      
      printer
        .font('a')
        .align('ct')
        .style('bu')
        .size(1, 1)
        .text('TEST PRINT')
        .text('IRFAN MEDICAL CENTER')
        .text('------------------------')
        .text('Printer test successful!')
        .cut()
        .close(() => {
          console.log('Test print completed!');
          process.exit(0);
        });
    });

  } catch (error) {
    console.error('Error testing printer:', error);
  }
}

testPrinter();
