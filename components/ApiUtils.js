// ApiUtils.js

var ApiUtils = {
   checkStatus: function(response) {
      return new Promise(function(resolve, reject) {
         if (response.status >= 200 && response.status < 300) {
            resolve(response);
         } else {
            let error = new Error(response.statusText);
            error.code = response.status;
            error.response = response;
            response.text().then((text) => {
               error.message = text;
               reject(error);
            });
         }
      });
   }
};

export { ApiUtils as default };
