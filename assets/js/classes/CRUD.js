var CRUD = (function () {
    // constructor
    function CRUD(tableName) {
        this.tableName = tableName; // The database table to perform CRUD operations on.
        this.http = angular.injector(["ng"]).get("$http"); // a field used to make HTTP calls
    }
    /**
    * Creates a record in the database table.
    */
    CRUD.prototype.create = function (model, success, error) {
        this.http({
            'method': 'post',
            'url': '/api/' + this.tableName + '/Create',
            'params': model
        }).then(function (response) {
            success(response.data.id);
        });
    };
    /**
    * Reads 1 or multiple records in the database
    */
    CRUD.prototype.read = function (id, success, error) {
        if (id == null) {
            this.http.get('/api/' + this.tableName + '').then(function (response) {
                success(response.data);
            }, function (response) {
                if (error)
                    error(response.data);
            });
        }
        else {
            this.http.get('/api/' + this.tableName + '/' + id).then(function (response) {
                if (success)
                    success(response.data);
            }, function (response) {
                if (error)
                    error(response.data);
            });
        }
    };
    ;
    /**
    * Updates a record in the database
    */
    CRUD.prototype.update = function (model, success, error) {
        this.http.put('/api/' + this.tableName + '/' + model.id, model).then(function (response) {
            var updated = response.data;
            if (success)
                success(updated.id);
        }, function (response) {
            if (error)
                error(response.data);
        });
    };
    /**
    * Deletes a record in the database
    */
    CRUD.prototype["delete"] = function (id, success, error) {
        this.http["delete"]("/api/" + this.tableName + "/" + id).then(function (response) {
            var deleted = response.data;
            if (success)
                success(deleted.id);
        }, function (response) {
            if (error)
                error(response.data);
        });
    };
    /**
    * Gets the attributes of the database table.
    */
    CRUD.prototype.attributes = function (success, error) {
        this.http.get("/api/" + this.tableName + "/attributes").then(function (r) {
            if (success)
                success(r.data);
        }, function (r) {
            if (error)
                error(r.data);
        });
    };
    return CRUD;
}());
//# sourceMappingURL=CRUD.js.map