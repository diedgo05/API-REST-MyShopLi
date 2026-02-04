require('dotenv').config();
const app = require('./app');

app.listen(process.env.PORT, () =>
  console.log(`API MyShopLi corriendo en puerto ${process.env.PORT}`)
);
