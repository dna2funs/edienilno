const base = __dirname;

const env = {
   base: base,
   debug: !!process.env.EDIENILNO_DEBUG,
   auth_internal: false,
   search_path: process.env.EDIENILNO_SEARCH_PATH,
   ldap_server: process.env.EDIENILNO_LDAP_SERVER,
   keyval: {
      // store key value into file;
      // if null, only in memory
      filename: process.env.EDIENILNO_KEYVAL_FILENAME || null
   },
   admins: process.env.EDIENILNO_ADMINS?process.env.EDIENILNO_ADMINS.split(','):[],
};

module.exports = env;
