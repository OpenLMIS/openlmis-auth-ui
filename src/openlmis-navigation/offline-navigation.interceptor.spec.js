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

describe('Offline navigation interceptor', function() {

    beforeEach(function() {
        module('openlmis-navigation', function($stateProvider) {
            $stateProvider.state('normal', {
                url: '/normal'
            });
            $stateProvider.state('offline', {
                url: '/offline',
                isOffline: true
            });
            $stateProvider.state('parent', {
                url: '/parent',
                isOffline: true
            });
            $stateProvider.state('parent.child', {
                url: '/child'
            });
            $stateProvider.state('parent.child.left', {
                url: '/left'
            });
            $stateProvider.state('parent.child.child', {
                url: '/child'
            });
            $stateProvider.state('parent.child.child.right', {
                url: '/right'
            });
            $stateProvider.state('parent.child.child.left', {
                url: '/left',
                isOffline: true
            });
            $stateProvider.state('parent.child.child.left.left', {
                url: '/left',
                isOffline: true
            });
            $stateProvider.state('parent.child.child.left.left.left', {
                url: '/left',
                isOffline: true
            });
        });

        inject(function($injector) {
            this.$state = $injector.get('$state');
            this.alertService = $injector.get('alertService');
            this.loadingModalService = $injector.get('loadingModalService');
            this.offlineService = $injector.get('offlineService');
            this.$rootScope = $injector.get('$rootScope');
            this.$q = $injector.get('$q');
        });

        this.isOffline = false;
        this.alertDeferred = this.$q.defer();

        spyOn(this.alertService, 'error').andReturn(this.alertDeferred.promise);
        this.alertService.close = jasmine.createSpy('close');
        spyOn(this.loadingModalService, 'close');

        var context = this;
        spyOn(this.offlineService, 'isOffline').andCallFake(function() {
            return context.isOffline;
        });
    });

    it('will show an alert if offline for non-offline state', function() {
        this.$state.go('normal');

        expect(this.alertService.error).not.toHaveBeenCalled();

        this.isOffline = true;

        this.$state.go('normal');

        expect(this.alertService.error).toHaveBeenCalled();
    });

    it('will never show an alert if route is offline', function() {
        this.$state.go('offline');

        expect(this.alertService.error).not.toHaveBeenCalled();

        this.isOffline = true;
        this.$state.go('offline');

        expect(this.alertService.error).not.toHaveBeenCalled();
    });

    it('will show an alert if offline and going to parent state with reload', function() {
        this.$state.go('parent.child.child');

        expect(this.alertService.error).not.toHaveBeenCalled();

        this.isOffline = true;

        this.$state.go('parent.child', {}, {
            reload: true
        });

        expect(this.alertService.error).toHaveBeenCalled();
    });

    it('will never show an alert if offline and going to parent state without reload', function() {
        this.$state.go('parent.child.child');
        this.$rootScope.$apply();

        this.isOffline = true;

        this.$state.go('parent.child');

        expect(this.alertService.error).not.toHaveBeenCalled();
    });

    it('will never show an alert if offline and going to an offline parent state with reload', function() {
        this.$state.go('parent.child.child');
        this.$rootScope.$apply();

        this.isOffline = true;

        this.$state.go('parent');

        expect(this.alertService.error).not.toHaveBeenCalled();
    });

    it('will never show an alert if offline path is available between state', function() {
        this.$state.go('parent.child.child.right');
        this.$rootScope.$apply();

        this.isOffline = true;

        this.$state.go('parent.child.child.left.left.left');

        expect(this.alertService.error).not.toHaveBeenCalled();
    });

    it('will show an alert if offline path is not available between state', function() {
        this.$state.go('parent.child.child.right');
        this.$rootScope.$apply();

        this.isOffline = true;

        this.$state.go('parent.child.left');

        expect(this.alertService.error).toHaveBeenCalled();
    });

    it('will close the offline alert when going online', function() {
        this.isOffline = true;
        this.$state.go('normal');
        this.$rootScope.$apply();

        expect(this.alertService.error).toHaveBeenCalled();
        expect(this.alertService.close).not.toHaveBeenCalled();

        this.$rootScope.$broadcast('openlmis.online');

        expect(this.alertService.close).toHaveBeenCalled();
    });

    it('will not close any alert on online event if no offline alert was opened', function() {
        this.$rootScope.$broadcast('openlmis.online');

        expect(this.alertService.close).not.toHaveBeenCalled();
    });

    it('will not close an already-dismissed offline alert on subsequent online event', function() {
        this.isOffline = true;
        this.$state.go('normal');
        this.$rootScope.$apply();

        this.alertDeferred.resolve();
        this.$rootScope.$apply();

        this.$rootScope.$broadcast('openlmis.online');

        expect(this.alertService.close).not.toHaveBeenCalled();
    });

});