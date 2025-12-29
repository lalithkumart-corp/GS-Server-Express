var fs = require('fs');
var spawn = require('child_process').spawn;
const cron = require("node-cron");
let appRootPath = require('app-root-path');
const { dbconfig } = require('../config');
/**
 
     * * * * * *
     | | | | | |
     | | | | | day of week
     | | | | month
     | | | day of month
     | | hour
     | minute
     second ( optional )
 */

class DbBackup {
    constructor(fileName) {
        this.fileName = fileName;
        this.extension = 'sql';
    }
    
    schedule() {
        try {
            console.log('Database auto backup enabled: Daily @ 11:30 AM');
            cron.schedule("30 11 * * *", () => { // 11:30am
                this.start()
                .then(
                    (successResp) => {
                        if(successResp.STATUS == 'success')
                            console.log(`Exported the DB successfully ${successResp.fileName}`);
                        else
                            console.log('Export failed...');
                    },
                    (errResp) => {
                        console.log(errResp);
                    }
                )
                .catch(
                    (e) => {
                        console.log(e);
                    }
                )
            });
        } catch(e) {
            console.log('CRON job - Uncaught Exception');
            console.log(e);
        }
    }

    start() {
        return new Promise( (resolve, reject) => {
            try {
                console.log('MYSQL DB backup: In progress....');
                let fileName = `${this.fileName}.${this.extension}`;
                if(fileName)
                    fileName = `${+new Date()}.${this.extension}`;
                let filePath = `${process.cwd()}/bkps/ds/`;
                let fullFilePath = filePath+fileName;
                var wstream = fs.createWriteStream(fullFilePath);
                
                // mysqldump is a command, and it will be set in ENV variables alone with 'mysql'
                // If mysqldump command not found, then set the path of mysql in ENV path, or mention the path of the mysqldump exe file. 
                // NORMALLY - If mysqldump is set properly in ENV varialbe mean, just mention "mysqldump"
                    // EX: spawn('mysqldump', [...]);
                // In Mac OS, i have not set 'mysql' in Env path, and so the 'mysqldump' also will throw as command not found. Do, mention the path as below 
                    // Ex: spawn('/usr/local/mysql/bin/mysqldump' [...])
                // IN WINDOWS
                    //Ex2: C:/Program Files/MySQL/MySQL Server 8.0/bin/mysqldump
                var mysqldump = spawn('mysqldump', [
                    '-u',
                    `${dbconfig.DB_USER}`,
                    `-p${dbconfig.DB_PASSWORD}`,
                    `${dbconfig.DB_NAME}`
                ]);
                
                mysqldump
                    .stdout
                    .pipe(wstream)
                    .on('finish', () => {
                        resolve({STATUS: 'success', fileName: fileName, filePath: filePath});
                    })
                    .on('error', (err) => {
                        console.log('ERROR ', err);
                        reject({STATUS: 'error', ERROR: err});
                    });
            } catch(e) {
                reject({STATUS: 'error', ERROR: e});
            }
            
        });
    }

}

let dbBackupInstance = new DbBackup();
dbBackupInstance.schedule();

module.exports = DbBackup;



/**
 

var fs = require('fs');
var spawn = require('child_process').spawn;
const cron = require("node-cron");
let appRootPath = require('app-root-path'); 

const task = () => {
    console.log('MYSQL DB backup');
    let fileName = +new Date();
    var wstream = fs.createWriteStream(appRootPath+`/backups/mysql/${fileName}.sql`);
    var mysqldump = spawn('mysqldump', [
        '-u',
        'root',
        '-proot',
        'gsprod'
    ]);
    
    mysqldump
        .stdout
        .pipe(wstream)
        .on('finish', function () {
            console.log('Completed')
        })
        .on('error', function (err) {
            console.log(err)
        });
}


try {
    console.log('CRON Module Enabled');
    cron.schedule("30 11 * * *", function() { // 11:30am
        task();
    });
} catch(e) {
    console.log('CRON job - Uncaught Exception');
    console.log(e);
}


 */
