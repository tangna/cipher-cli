# cipher-cli

加密
cipher-cli -c config.json -t en

encipherSource 表示要加密的文件或文件夹
encipherDest 表示加密之后的文件
encipherMode 表示加密的方式
  oneFile，加密成单个文件;
  perFile，加密encipherSource文件夹下面的每一个文件

解密
cipher-cli -c config.json -t de

decipherSource 表示要解密的文件或文件夹
decipherDir 表示存储解密后文件的文件夹位置
