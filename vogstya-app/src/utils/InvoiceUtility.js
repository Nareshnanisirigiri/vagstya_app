export const generateInvoiceHtml = (order) => {
  const items = order.items || order.lines || [];
  const totals = order.totals || { subtotal: 0, tax: 0, grandTotal: 0 };
  const address = order.address || {};
  
  // Calculate individual tax components (mocking 5% GST as in image)
  const cgstRate = 2.5;
  const sgstRate = 2.5;
  const igstRate = 0;

  const totalAmount = totals.grandTotal || order.total_amount || order.price || 0;
  
  // Convert number to words (simple implementation for now)
  const numberToWords = (num) => {
    const a = ['', 'One ', 'Two ', 'Three ', 'Four ', 'Five ', 'Six ', 'Seven ', 'Eight ', 'Nine ', 'Ten ', 'Eleven ', 'Twelve ', 'Thirteen ', 'Fourteen ', 'Fifteen ', 'Sixteen ', 'Seventeen ', 'Eighteen ', 'Nineteen '];
    const b = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];

    const inWords = (n) => {
      if ((n = n.toString()).length > 9) return 'overflow';
      let n_arr = ('000000000' + n).substr(-9).match(/^(\d{2})(\d{2})(\d{2})(\d{1})(\d{2})$/);
      if (!n_arr) return '';
      let str = '';
      str += (n_arr[1] != 0) ? (a[Number(n_arr[1])] || b[n_arr[1][0]] + ' ' + a[n_arr[1][1]]) + 'Crore ' : '';
      str += (n_arr[2] != 0) ? (a[Number(n_arr[2])] || b[n_arr[2][0]] + ' ' + a[n_arr[2][1]]) + 'Lakh ' : '';
      str += (n_arr[3] != 0) ? (a[Number(n_arr[3])] || b[n_arr[3][0]] + ' ' + a[n_arr[3][1]]) + 'Thousand ' : '';
      str += (n_arr[4] != 0) ? (a[Number(n_arr[4])] || b[n_arr[4][0]] + ' ' + a[n_arr[4][1]]) + 'Hundred ' : '';
      str += (n_arr[5] != 0) ? ((str != '') ? 'and ' : '') + (a[Number(n_arr[5])] || b[n_arr[5][0]] + ' ' + a[n_arr[5][1]]) + 'only ' : '';
      return str;
    };
    return inWords(Math.floor(num));
  };

  const amountInWords = numberToWords(totalAmount);

  return `
    <html>
      <head>
        <title>Invoice #${order.order_id || order.id}</title>
        <style>
          body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; padding: 20px; color: #333; font-size: 10px; line-height: 1.4; }
          .invoice-container { max-width: 800px; margin: 0 auto; border: 1px solid #000; padding: 15px; }
          .title { font-weight: bold; font-size: 14px; text-decoration: underline; margin-bottom: 5px; }
          .original-note { font-size: 8px; font-style: italic; margin-bottom: 10px; }
          
          .grid-container { display: grid; grid-template-columns: 1fr 1fr; border: 1px solid #000; margin-bottom: 15px; }
          .grid-item { padding: 8px; border-right: 1px solid #000; }
          .grid-item:last-child { border-right: none; }
          
          .label { font-weight: bold; margin-bottom: 2px; }
          .value { margin-bottom: 5px; }
          
          .info-section { margin-bottom: 15px; }
          .info-row { display: flex; margin-bottom: 2px; }
          .info-label { font-weight: bold; width: 120px; }
          
          table { width: 100%; border-collapse: collapse; margin-bottom: 15px; border: 1px solid #000; }
          th { border: 1px solid #000; padding: 5px; background-color: #f2f2f2; font-weight: bold; text-align: center; }
          td { border: 1px solid #000; padding: 5px; vertical-align: top; }
          
          .text-right { text-align: right; }
          .text-center { text-align: center; }
          
          .footer-section { margin-top: 20px; }
          .amount-words { font-weight: bold; margin-bottom: 15px; }
          .signature-area { margin-top: 30px; text-align: right; }
          .signature-line { border-top: 1px solid #000; width: 150px; display: inline-block; margin-top: 40px; }
          
          .total-tax-row { font-weight: bold; margin-bottom: 5px; }
          .total-amount-row { font-weight: bold; font-size: 12px; margin-bottom: 5px; }
        </style>
      </head>
      <body>
        <div class="invoice-container">
          <div class="title">Tax Invoice/Bill of Supply/Cash Memo</div>
          <div class="original-note">(Original for Recipient)</div>
          
          <div class="grid-container">
            <div class="grid-item">
              <div class="label">Sold By :</div>
              <div class="value">
                Vogue By Satyabhama<br/>
                Kukatpally, Hyderabad, Telangana<br/>
                Gst : 33AWIPG4244K1ZF
              </div>
            </div>
            <div class="grid-item">
              <div class="label">Billing Address :</div>
              <div class="value">
                ${address.fullName || order.customer_name || "Customer"}<br/>
                ${address.street || ""}, ${address.city || ""}, ${address.state || ""}<br/>
                Pin: ${address.pincode || ""}<br/>
                State/UT Code: N/A
              </div>
              <div class="label">Shipping Address :</div>
              <div class="value">
                ${address.fullName || order.customer_name || "Customer"}<br/>
                ${address.street || ""}, ${address.city || ""}, ${address.state || ""}<br/>
                Pin: ${address.pincode || ""}<br/>
                State/UT Code: N/A
              </div>
            </div>
          </div>
          
          <div class="info-section">
            <div class="info-row"><div class="info-label">Order Number:</div><div>${order.order_id || order.id || "N/A"}</div></div>
            <div class="info-row"><div class="info-label">Order Date:</div><div>${new Date(order.created_at || order.createdAt || Date.now()).toLocaleDateString()}</div></div>
            <div class="info-row"><div class="info-label">Invoice Number:</div><div>INV-${order.order_id || order.id || "N/A"}</div></div>
            <div class="info-row"><div class="info-label">Invoice Details:</div><div>-</div></div>
            <div class="info-row"><div class="info-label">Invoice Date:</div><div>${new Date().toLocaleDateString()}</div></div>
          </div>
          
          <table>
            <thead>
              <tr>
                <th style="width: 30px;">SI.</th>
                <th>Description</th>
                <th style="width: 70px;">Unit Price</th>
                <th style="width: 30px;">Qty</th>
                <th style="width: 70px;">Net Amount</th>
                <th style="width: 70px;">Tax</th>
                <th style="width: 60px;">Tax Amt</th>
                <th style="width: 70px;">Total</th>
              </tr>
            </thead>
            <tbody>
              ${items.length > 0 ? items.map((item, index) => {
                const itemPrice = item.price || (totalAmount / (items.length || 1));
                const itemQty = item.qty || 1;
                const netAmount = itemPrice * itemQty;
                const taxAmt = netAmount * 0.05; // 5% total tax
                const total = netAmount + taxAmt;
                
                return `
                  <tr>
                    <td class="text-center">${index + 1}</td>
                    <td>
                      ${item.name || "Jewellery Item"}<br/>
                      (N/A)<br/>
                      HSN: 5007
                    </td>
                    <td class="text-right">₹${Number(itemPrice).toFixed(2)}</td>
                    <td class="text-center">${itemQty}</td>
                    <td class="text-right">₹${Number(netAmount).toFixed(2)}</td>
                    <td>
                      CGST(2.5%)<br/>
                      SGST(2.5%)
                    </td>
                    <td class="text-right">
                      ₹${Number(taxAmt/2).toFixed(2)}<br/>
                      ₹${Number(taxAmt/2).toFixed(2)}
                    </td>
                    <td class="text-right">₹${Number(total).toFixed(2)}</td>
                  </tr>
                `;
              }).join('') : `
                <tr>
                  <td class="text-center">1</td>
                  <td>
                    Jewellery Sale Transaction<br/>
                    (N/A)<br/>
                    HSN: 5007
                  </td>
                  <td class="text-right">₹${Number(totalAmount / 1.05).toFixed(2)}</td>
                  <td class="text-center">1</td>
                  <td class="text-right">₹${Number(totalAmount / 1.05).toFixed(2)}</td>
                  <td>
                    CGST(2.5%)<br/>
                    SGST(2.5%)
                  </td>
                  <td class="text-right">
                    ₹${Number((totalAmount - (totalAmount / 1.05)) / 2).toFixed(2)}<br/>
                    ₹${Number((totalAmount - (totalAmount / 1.05)) / 2).toFixed(2)}
                  </td>
                  <td class="text-right">₹${Number(totalAmount).toFixed(2)}</td>
                </tr>
              `}
              <tr>
                <td colspan="4"></td>
                <td class="text-right">Delivery Charges</td>
                <td class="text-right">₹0</td>
                <td>
                  SGST (9%)<br/>
                  CGST (9%)
                </td>
                <td class="text-right">
                  ₹0<br/>
                  ₹0
                </td>
                <td class="text-right">₹0</td>
              </tr>
              <tr>
                <td colspan="7" class="label">Total</td>
                <td class="text-right label">₹${Number(totalAmount).toFixed(2)}</td>
              </tr>
            </tbody>
          </table>
          
          <div class="total-tax-row">Total Tax: ₹${Number(totalAmount - (totalAmount / 1.05)).toFixed(2)}</div>
          <div class="total-amount-row">Total Amount: ₹${Number(totalAmount).toFixed(2)}</div>
          <div class="amount-words">Amount in Words: ${amountInWords}</div>
          
          <div class="footer-section">
            <div>For Company:</div>
            <div class="signature-area">
              Authorized Signatory
              <br/><div class="signature-line"></div>
            </div>
            <div style="margin-top: 10px;">Whether tax is payable under reverse charge - <b>No</b></div>
          </div>
        </div>
        
        <script>
          window.onload = function() { 
            setTimeout(() => {
              window.print(); 
              // Only close if it's not the main window
              if (window.opener) {
                window.close(); 
              }
            }, 500);
          }
        </script>
      </body>
    </html>
  `;
};
