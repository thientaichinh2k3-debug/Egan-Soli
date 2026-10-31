# Egan-Soli
Solidity Basic

## Cài đặt và chạy

Yêu cầu: Node.js 18 trở lên.

```bash
npm install
npm run compile   # biên dịch các hợp đồng trong contracts/
npm test          # chạy kiểm thử trong test/
npm run node      # chạy mạng thử nghiệm cục bộ
npm run deploy    # triển khai lên mạng tạm trong bộ nhớ
npm run deploy:local  # triển khai lên mạng đang chạy bởi npm run node
```

Đổi hợp đồng cần triển khai bằng biến `CONTRACT`, ví dụ `CONTRACT=TenHopDong npm run deploy`.

Trình biên dịch Solidity 0.8.24 được lấy từ gói npm `solc`, nên không cần tải từ binaries.soliditylang.org.
