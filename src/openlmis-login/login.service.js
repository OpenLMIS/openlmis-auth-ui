/*
 * This program is part of the OpenLMIS logistics management information system platform software.
 * Copyright © 2017 VillageReach
 *
 * This program is free software: you can redistribute it and/or modify it under the terms
 * of the GNU Affero General Public License as published by the Free Software Foundation, either
 * version 3 of the License, or (at your option) any later version.
 *  
 * This program is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY;
 * without even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. 
 * See the GNU Affero General Public License for more details. You should have received a copy of
 * the GNU Affero General Public License along with this program. If not, see
 * http://www.gnu.org/licenses.  For additional information contact info@OpenLMIS.org. 
 */

(function(){
    'use strict';

    /**
     * @ngdoc service
     * @name openlmis-login.loginService
     *
     * @description
     * Facilitates the login process between the OpenLMIS Server and the UI client.
     * This service works with the authorizationService, which is responsible for storing implementation details.
     */
    angular
        .module('openlmis-login')
        .service('loginService', loginService);

    loginService.$inject = ['$rootScope', '$q', '$http', 'authUrl', 'openlmisUrlFactory', 'authorizationService',
                            '$state', 'offlineService'];

    function loginService($rootScope, $q, $http, authUrl, openlmisUrlFactory, authorizationService,
                            $state, offlineService) {

        this.login = login;
        this.logout = logout;

        /**
         * @ngdoc method
         * @methodOf openlmis-login.loginService
         * @name login
         *
         * @description
         * Sets authorization service with basic user data and fires
         * openlmis-auth.login when requestLogin is successful.
         *
         * @param {String} username The username of the person trying to login
         * @param {String} password The password the person is trying to login with
         * @return {Promise} Returns promise from requestLogin
         */
        function login(username, password) {
            return requestLogin(username, password)
            .then(function(response) {
                authorizationService.setAccessToken(response.accessToken);
                authorizationService.setUser(response.userId, response.username);
                return response;
            });
        }

        /**
         * @ngdoc method
         * @methodOf openlmis-login.loginService
         * @name requestLogin
         *
         * @description
         * Calls the OpenLMIS oauth service, and returns an object with the user's
         * access token and user id. If the call to OpenLMIS oauth is unsuccessful
         * then the promise is rejected with an error message.
         *
         * @param {String} username The name of the person trying to login
         * @param {String} password The password the person is trying to login with
         * @return {Promise} Resolves when successful, rejects otherwise
         */
        function requestLogin(username, password) {
            if(offlineService.isOffline()) {
                return $q.reject('openlmisLogin.cannotConnectToServer');
            }

            return $http({
                method: 'POST',
                url: authUrl('/api/oauth/token?grant_type=password'),
                data: 'username=' + username + '&password=' + password,
                headers: {
                    'Authorization': authorizationHeader(),
                    'Content-Type': 'application/x-www-form-urlencoded'
                }
            })
            .then(function(response) {
                return $q.resolve({
                    userId: response.data.referenceDataUserId,
                    username: response.data.username,
                    accessToken: response.data.access_token
                });
            })
            .catch(function(response) {
                if (response.status === 400) {
                    return $q.reject('openlmisLogin.invalidCredentials');
                } else if (response.status === -1) {
                    return $q.reject('openlmisLogin.cannotConnectToServer');
                } else {
                    return $q.reject('openlmisLogin.unknownServerError');
                }
            });
        }

        function authorizationHeader() {
            var data = btoa('@@AUTH_SERVER_CLIENT_ID' + ':' + '@@AUTH_SERVER_CLIENT_SECRET');
            return 'Basic ' + data;
        }

        /**
         * @ngdoc method
         * @methodOf openlmis-login.loginService
         * @name logout
         *
         * @description
         * Attempts to logout through the OpenLMIS Auth Service, but will always
         * clear the user data and access token, even if logout fails.
         *
         * The event openlmis-auth.logout is fired after values have been removed
         * from the authorizationService.
         *
         * @return {Promise} A resolved promise
         */
        function logout() {
            var deferred = $q.defer();

            requestLogout()
            .finally(function() {
                authorizationService.clearAccessToken();
                authorizationService.clearUser();
                deferred.resolve();
            });

            return deferred.promise;
        }

        /**
         * @ngdoc method
         * @methodOf openlmis-login.loginService
         * @name  requestLogout
         *
         * @description
         * Handles the request to the OpenLMIS Auth Service, and tries to end the
         * user's session.
         *
         * @return {Promise} A promise that indicates if the user was logged out.
         */
        function requestLogout() {
            if (offlineService.isOffline()) {
                return $q.reject();
            }

            return $http({
                method: 'POST',
                url: authUrl('/api/users/auth/logout'),
                ignoreAuthModule: true
            })
            .then(function() {
                return $q.resolve();
            })
            .catch(function(data) {
                if (data.status === 401) {
                    return $q.resolve();
                } else {
                    return $q.reject();
                }
            });
        }
    }

})();
