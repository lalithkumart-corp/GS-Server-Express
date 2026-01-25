module.exports = {
    name: "Category",
    columns: {
        id: {
            primary: true,
            type: "int",
            generated: true
        },
        name: {
            type: "varchar"
        },
        "SNo": {
            "type": "int",
            "id": true,
            "mysql": {
                "columnName": "s_no",
                "dataType": "int",
                "dataLength": null,
                "dataPrecision": null,
                "dataScale": 0,
                "nullable": "Y"
            }
        },
        "userId": {
            "type": "int",
            "mysql": {
                "columnName": "user_id",
                "dataType": "int",
                "dataLength": null,
                "dataPrecision": null,
                "dataScale": 0,
                "nullable": "Y"
            }
        },
        "billSeries": {
            "type": "varchar",
            "mysql": {
                "columnName": "bill_series",
                "dataType": "varchar",
                "dataLength": null,
                "dataPrecision": null,
                "dataScale": 0,
                "nullable": "Y"
            }
        },
        "lastCreatedBillNo": {
            "type": "int",
            "mysql": {
                "columnName": "last_created_bill_no",
                "dataType": "int",
                "dataLength": null,
                "dataPrecision": null,
                "dataScale": 0,
                "nullable": "Y"
            }
        },
            "billStart": {
            "type": "int",
            "mysql": {
                "columnName": "bill_start",
                "dataType": "int",
                "dataLength": null,
                "dataPrecision": null,
                "dataScale": 0,
                "nullable": "Y"
            }
            },
            "billLimit": {
            "type": "int",
            "mysql": {
                "columnName": "bill_limit",
                "dataType": "int",
                "dataLength": null,
                "dataPrecision": null,
                "dataScale": 0,
                "nullable": "Y"
            }
        }
    }
};