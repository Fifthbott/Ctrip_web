在 Taro 中，若要将文件通过 `request` 请求发送到服务器，通常是通过 `multipart/form-data` 格式来上传文件。你可以使用 Taro 提供的 `Taro.uploadFile` 方法来上传文件，或者直接使用 `Taro.request` 方法进行文件上传。

以下是一个上传文件的实现方式：

### 1. 使用 `Taro.uploadFile` 上传文件

这是一个专门为文件上传设计的 API，它支持将文件以 `multipart/form-data` 格式上传到指定的服务器地址。

```js
import Taro from '@tarojs/taro';

const uploadFile = () => {
  Taro.chooseImage({
    success: (res) => {
      const filePath = res.tempFilePaths[0]; // 获取用户选择的文件路径
      Taro.uploadFile({
        url: 'https://your-server.com/upload',  // 服务器的上传接口
        filePath: filePath,                    // 文件路径
        name: 'file',                           // 对应后端接口中表单字段的名称
        formData: {
          'user': 'test',                      // 可选，额外传递的表单字段
        },
        success: (uploadRes) => {
          console.log('文件上传成功', uploadRes);
        },
        fail: (err) => {
          console.log('文件上传失败', err);
        }
      });
    }
  });
};
```

### 2. 使用 `Taro.request` 上传文件

如果你需要自己处理文件内容，或者希望通过 `request` 请求上传文件，可以手动设置 `Content-Type` 为 `multipart/form-data`，并构建合适的 `FormData`。不过需要注意，Taro 本身并不直接支持 `FormData`，你需要自己构造一个。

```js
import Taro from '@tarojs/taro';

const uploadFileUsingRequest = async () => {
  try {
    const res = await Taro.chooseImage({
      count: 1,
    });

    const filePath = res.tempFilePaths[0];  // 获取文件路径

    const file = Taro.getFileSystemManager().readFileSync(filePath); // 读取文件内容

    const formData = new FormData();
    formData.append('file', file, 'file.jpg');  // 'file' 是字段名，'file.jpg' 是文件名

    const response = await Taro.request({
      url: 'https://your-server.com/upload',
      method: 'POST',
      header: {
        'Content-Type': 'multipart/form-data',  // 设置 multipart/form-data 类型
      },
      data: formData,
    });

    console.log('文件上传成功', response.data);
  } catch (error) {
    console.log('文件上传失败', error);
  }
};
```

### 3. 上传多个文件

如果你需要上传多个文件，可以修改 `chooseImage` 的 `count` 参数，选择多个文件，然后上传所有的文件。

```js
import Taro from '@tarojs/taro';

const uploadMultipleFiles = () => {
  Taro.chooseImage({
    count: 5,  // 最多选择5个文件
    success: (res) => {
      const filePaths = res.tempFilePaths;  // 获取选择的多个文件路径
      const files = filePaths.map((filePath) => {
        return {
          filePath,
          name: 'file', // 你可以给每个文件指定相同的字段名 'file'
        };
      });

      files.forEach((file) => {
        Taro.uploadFile({
          url: 'https://your-server.com/upload',
          filePath: file.filePath,
          name: file.name,
          success: (uploadRes) => {
            console.log('文件上传成功', uploadRes);
          },
          fail: (err) => {
            console.log('文件上传失败', err);
          },
        });
      });
    },
  });
};
```

### 注意事项

- **`name` 字段**：在上传文件时，`name` 需要与后端接口接收文件字段的名称保持一致。
- **文件格式**：你可以通过 `Taro.chooseImage` 选择图片，也可以通过其他选择方式上传其他类型的文件（例如 `Taro.chooseVideo`，`Taro.chooseMedia` 等）。
- **跨域问题**：如果你的服务器是跨域的，请确保你的服务器已经配置了正确的 CORS 头部来允许文件上传。

通过这些方式，你可以通过 Taro 上传文件到服务器。如果后端接口要求使用 `multipart/form-data` 格式，`Taro.uploadFile` 是最简单的方式，它会自动处理格式和文件内容。







docker run -p 33706:3306 --name mysql -v /home/mysql/log:/var/log/mysql  -v /home/mysql/data:/var/lib/mysql  -v /home/mysql/conf/my.cnf:/etc/mysql/my.cnf --restart=always  -v /home/mysql/data/mysql-files:/var/lib/mysql-files -e MYSQL_ROOT_PASSWORD=lsl4@as3$s6fs -d mysql:8.0.20   





docker run -p 3306:3306   --restart=always   --name mysql   --privileged=true   -v /home/mysql/log:/var/log/mysql   -v /home/mysql/data:/var/lib/mysql   -v /home/mysql/conf/my.cnf:/etc/mysql/my.cnf   -v /home/mysql/data/mysql-files:/var/lib/mysql-files   -e MYSQL_ROOT_PASSWORD=123456   -d mysql:8.0.20

docker run \
-p 3306:3306 \
--restart=always \
--name mysql \
--privileged=true \
-v /home/mysql/log:/var/log/mysql \
-v /home/mysql/data:/var/lib/mysql \
-v /home/mysql/conf/my.cnf:/etc/mysql/my.cnf \
-e MYSQL_ROOT_PASSWORD=123456 \
-d mysql:8.0.20  

grant all privileges on *.*  to 'root'@'localhost' ; 



ALTER USER 'user1'@'%' IDENTIFIED BY 'qwe123' PASSWORD EXPIRE NEVER;

ALTER USER 'user1'@'%' IDENTIFIED WITH mysql_native_password BY 'qwe123';

show grants for 'user1'@'%';





 **create user user1@'%' identified by 'j38#fhsj@0j3';**

**ALTER USER 'user1'@'%' IDENTIFIED BY 'j38#fhsj@0j3' PASSWORD EXPIRE NEVER;**

**ALTER USER 'user1'@'%' IDENTIFIED WITH mysql_native_password BY 'Hu12345@';**

**FLUSH PRIVILEGES;**

grant all privileges on *.* to user1; 

show grants for 'user1'@'%'; 