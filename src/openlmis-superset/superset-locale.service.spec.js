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

describe('supersetLocaleService', function() {

    var that = this;

    beforeEach(function() {
        that.SUPERSET_URL = 'http://localhost/superset';
        that.DEFAULT_LANGUAGE = 'en';

        module('openlmis-superset', function($provide) {
            $provide.constant('SUPERSET_URL', that.SUPERSET_URL);
            $provide.constant('DEFAULT_LANGUAGE', that.DEFAULT_LANGUAGE);
        });

        inject(function($injector) {
            that.supersetLocaleService = $injector.get('supersetLocaleService');
            that.$httpBackend = $injector.get('$httpBackend');
        });

    });

    describe('changeLocale', function() {

        // eslint-disable-next-line jasmine/missing-expect
        it('should send change language request', function() {
            that.$httpBackend.expectGET(that.SUPERSET_URL + '/lang/change/' + that.DEFAULT_LANGUAGE);

            that.supersetLocaleService.changeLocale(that.DEFAULT_LANGUAGE);
        });

        // eslint-disable-next-line jasmine/missing-expect
        it('should change the language to default if a not known locale provided', function() {
            that.$httpBackend.expectGET(that.SUPERSET_URL + '/lang/change/' + that.DEFAULT_LANGUAGE);

            that.supersetLocaleService.changeLocale('not_known_locale');
        });

        afterEach(function() {
            that.$httpBackend.verifyNoOutstandingExpectation();
            that.$httpBackend.verifyNoOutstandingRequest();
        });
    });

});
