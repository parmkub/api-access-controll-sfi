const express = require('express')
var cors = require('cors')
var app = express()
app.use(express.json())
app.use(express.urlencoded({ extended: true }))


app.listen(5001, function () {
    console.log('CORS-enabled web server listening on port 5001')
})


app.use(cors())

var oracledb = require("oracledb");
const e = require('express')
oracledb.autoCommit = true;
oracledb.extendedMetaData = false;
const Connection = { user: "sfi", password: 'sfi', connectString: "10.2.1.13:1521/PROD" }




// insert ข้อมูลด้วยรหัสพนักงาน แบบ get (check IN)
app.get('/api/check', function (req, res, next) {

    var card_raw = req.query.card_raw;
    var machine_id = req.query.machine_id;

    var last_name = '';
    var first_name = '';
    var position_code = '';
    var employee_code = '';
    oracledb.getConnection(Connection,
        function (err, connection) {
            if (err) {
                console.error(err); return;
            }
            connection.execute("SELECT ENG_FIRST_NAME,ENG_LAST_NAME,position_code, employee_code  FROM sf_per_access_personal_v WHERE card_raw = '" + card_raw + "'",
                [],
                { outFormat: oracledb.OUT_FORMAT_OBJECT },
                function (err, result) {
                    if (err) {
                        console.error(err); return;
                    }
                    if (result.rows.length == 0 || result.rows == null) {
                        var data = [{
                            ENG_FIRST_NAME: first_name,
                            ENG_LAST_NAME: last_name,
                            POSITION_CODE: position_code,
                            STATUS: 3,
                            MESSAGE: "access denied"
                        }]
                        console.log(data);
                        res.json(data);
                        return;
                    } else {

                        position_code = result.rows[0].POSITION_CODE;
                        first_name = result.rows[0].ENG_FIRST_NAME;
                        last_name = result.rows[0].ENG_LAST_NAME;
                        employee_code = result.rows[0].EMPLOYEE_CODE;
                        console.log(position_code);
                        console.log(first_name);
                        console.log(last_name);
                        console.log(employee_code);

                        //insert Data to table 
                        var sql = "INSERT INTO SF_PER_ACCESS_TRANSITION (EMPLOYEE_CODE, TIME_STAMP, MACHINE_ID) VALUES (" + employee_code + ",SYSDATE, " + machine_id + ")";
                        console.log(sql);
                        connection.execute(sql,
                            [],
                            { outFormat: oracledb.OUT_FORMAT_OBJECT },
                            function (err, result) {
                                if (err) {
                                    console.error(err); return;
                                }
                                var data = [{
                                    ENG_FIRST_NAME: first_name,
                                    ENG_LAST_NAME: last_name,
                                    POSITION_CODE: position_code,
                                    EMPLOYEE_CODE: employee_code,
                                    STATUS: 1,
                                    MESSAGE: "Check in Success"
                                }]
                                console.log(data);
                                res.json(data);
                            }
                        );
                        
                    }



                    // res.json(result.rows)

                });
        });
})

// check OUT ด้วยรหัสพนักงาน แบบ get
app.get('/api/checkOut', function (req, res, next) {
    var employee_code = req.query.employee_code;
    var room_id = req.query.room_id;

    var last_name = '';
    var first_name = '';
    var company_code = '';
    var employee_id = '';

    oracledb.getConnection(Connection,
        function (err, connection) {
            if (err) {
                console.error(err); return;
            }
            connection.execute("SELECT ENG_FIRST_NAME,ENG_LAST_NAME,company_code, employee_id  FROM sf_per_employees WHERE employee_code = '" + employee_code + "'",
                [],
                { outFormat: oracledb.OUT_FORMAT_OBJECT },
                function (err, result) {
                    if (err) {
                        console.error(err); return;
                    }
                    if (result.rows.length == 0) {
                        var data = [{
                            ENG_FIRST_NAME: first_name,
                            ENG_LAST_NAME: last_name,
                            COMPANY_CODE: company_code,
                            STATUS: 3,
                            MESSAGE: "access denied"
                        }]
                        console.log(data);
                        res.json(data);
                        return;
                    } else {
                        company_code = result.rows[0].COMPANY_CODE;
                        first_name = result.rows[0].ENG_FIRST_NAME;
                        last_name = result.rows[0].ENG_LAST_NAME;
                        employee_id = result.rows[0].EMPLOYEE_ID;
                        console.log(company_code);
                        console.log(first_name);
                        console.log(last_name);

                        // ตรวจสอบว่ามีพนักงานคนนี้อยู่ในห้องหรือไม่ ด้วย employee_id
                        var sql = "SELECT * FROM ACCESS_ROOM_ENTRIES WHERE employee_id = " + employee_id + " AND room_id = " + room_id + " AND exit_time IS NULL";
                        console.log(sql);
                        connection.execute(sql,
                            [],
                            { outFormat: oracledb.OUT_FORMAT_OBJECT },
                            function (err, result) {
                                if (err) {
                                    console.error(err); return;
                                }
                                if (result.rows.length > 0) {
                                    //update exit_time
                                    var sql = "UPDATE ACCESS_ROOM_ENTRIES SET exit_time = SYSDATE WHERE employee_id = " + employee_id + " AND room_id = " + room_id + " AND exit_time IS NULL";
                                    console.log(sql);
                                    connection.execute(sql,
                                        [],
                                        { outFormat: oracledb.OUT_FORMAT_OBJECT },
                                        function (err, result) {
                                            if (err) {
                                                console.error(err); return;
                                            }
                                            //json data firstname,lastname,company_code,employee_id,room_id,status
                                            var data = [{
                                                ENG_FIRST_NAME: first_name,
                                                ENG_LAST_NAME: last_name,
                                                COMPANY_CODE: company_code,
                                                STATUS: 1,
                                                MESSAGE: "Check out Success"
                                            }]
                                            console.log(data);
                                            res.json(data);
                                        }
                                    );
                                } else {
                                    //insert data
                                    var sql = "INSERT INTO access_room_entries (employee_id, room_id, exit_time) VALUES (" + employee_id + ", " + room_id + ", SYSDATE)";
                                    console.log(sql);
                                    connection.execute(sql,
                                        [],
                                        { outFormat: oracledb.OUT_FORMAT_OBJECT },
                                        function (err, result) {
                                            if (err) {
                                                console.error(err); return;
                                            }
                                            //json data firstname,lastname,company_code,employee_id,room_id,status
                                            var data = [{
                                                ENG_FIRST_NAME: first_name,
                                                ENG_LAST_NAME: last_name,
                                                COMPANY_CODE: company_code,
                                                STATUS: 1,
                                                MESSAGE: "Check out Success"
                                            }]
                                            console.log(data);
                                            res.json(data);
                                        }
                                    );


                                    // var data = [{
                                    //     ENG_FIRST_NAME: first_name,
                                    //     ENG_LAST_NAME: last_name,
                                    //     COMPANY_CODE: company_code,
                                    //     STATUS: 0,
                                    //     MESSAGE: "Not in room"
                                    // }]
                                    // console.log(data);
                                    // res.json(data);
                                }
                            });
                    }

                });
        });
})



// เช็คสถานะการเชื่อมต่อ Oracle
app.get('/api/checkConnect', function (req, res, next) {
    oracledb.getConnection(Connection,
        function (err, connection) {
            if (err) {
                //ถ้าเชื่อมต่อไม่ได้ให้ส่งค่า Json object กลับไป
                var data = [{
                    STATUS: 0,
                    MESSAGE: "Can't connect Oracle"
                }]
                res.json(data);
            } else {
                var data = [{
                    STATUS: 1,
                    MESSAGE: "Connect Oracle Success"
                }]
                res.json(data);
            } 
            console.log(data);

        });
})





