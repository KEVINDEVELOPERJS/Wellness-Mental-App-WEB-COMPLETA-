// express-async-errors no incluye typings propios (v3.1.1). Solo se usa como
// side-effect: `import 'express-async-errors';` para que Express 4 reenvíe los
// rechazos de handlers async al middleware de errores en lugar de crashear.
declare module 'express-async-errors';