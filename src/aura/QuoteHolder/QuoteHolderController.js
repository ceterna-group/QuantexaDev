/**
 * Created by ronanwilliams on 2019-08-27.
 */

({

    doInit : function($C,$E,$H){

        var getInfo = $C.get('c.getProductLines');
        getInfo.setParams({ recordId : $C.get('v.recordId')});
        getInfo.setCallback(this, function(response){
            console.log(response.getState());
            console.log(response.getReturnValue());

            if (response.getState() === 'SUCCESS'){

                var dependencies = {};
                Object.keys(response.getReturnValue()['DEPENDENCIES']).forEach(function(dependency){
                    dependencies[dependency] = response.getReturnValue()['DEPENDENCIES'][dependency];
                });

                $C.set('v.dependencies',dependencies);
                $C.set('v.families',response.getReturnValue()['FAMILIES']);
                $C.set('v.useCases',response.getReturnValue()['USECASES']);

                var familyGroups = [];
                var productLines = [];

                Object.keys(response.getReturnValue()['FAMILYGROUPS']).forEach(function(group){
                    var family      = {};
                    family.Name     = group;
                    family.Year1    = 0;
                    family.Year2    = 0;
                    family.Year3    = 0;
                    family.Year4    = 0;
                    family.Year5    = 0;
                    family.Total    = 0;
                    family.UseCases = [];
                    family.Dependencies = response.getReturnValue()['DEPENDENCIES'][group];

                    Object.keys(response.getReturnValue()['FAMILYGROUPS'][group]).forEach(function(caseName){
                        var useCase         = {};
                        useCase.Name        = caseName;
                        useCase.Year1       = 0;
                        useCase.Year2       = 0;
                        useCase.Year3       = 0;
                        useCase.Year4       = 0;
                        useCase.Year5       = 0;
                        useCase.Total       = 0;
                        useCase.Products    = [];

                        Object.keys(response.getReturnValue()['FAMILYGROUPS'][group][caseName]).forEach(function(product){
                            var prod        = {};
                            prod.Family             = group;
                            prod.UseCase            = caseName;
                            prod.Id                 = product.split(':')[2];
                            prod.PricebookEntryId   = product.split(':')[3];
                            prod.Name               = product.split(':')[1];
                            prod.Total              = 0;
                            prod.Success            = '';
                            prod.Entries            = response.getReturnValue()['FAMILYGROUPS'][group][caseName][product];
                            prod.DiscountPercent    = false;
                            useCase.Products.push(prod);
                        });
                        family.UseCases.push(useCase);
                    });
                    familyGroups.push(family);
                });
                $C.set('v.familyGroups',familyGroups);
                $C.set('v.productLines',productLines);
                $C.set('v.finishedLoad',true);
                $H.calculateTotals($C,$E);
            }
        });
        $A.enqueueAction(getInfo);
    },
    createFamily : function($C,$E,$H){

        var familyName      = $C.find('codelistInput').getElement().value;
        var familyGroups    = $C.get('v.familyGroups');

        var family      = {};
        family.Name     = familyName;
        family.Year1    = 0;
        family.Year2    = 0;
        family.Year3    = 0;
        family.Year4    = 0;
        family.Year5    = 0;
        family.Total    = 0;
        family.UseCases = [];
        family.Dependencies = $C.get('v.dependencies')[familyName];
        familyGroups.push(family);

        $C.set('v.familyGroups',familyGroups);
        $C.find('codelistInput').getElement().value = null;

        var families = $C.get('v.families');
        for (var x = 0; x < families.length; x++){
            if (families[x] === familyName){
                families.splice(x,1);
            }
        }
        $C.set('v.families',families);

    },
    addUseCase : function($C,$E,$H){

        var sourceData      = $E.currentTarget.dataset;
        var useCaseName     = $E.currentTarget.value.split(':')[0];
        var useCaseIndex    = $E.currentTarget.value.split(':')[1];
        var familyGroups    = $C.get('v.familyGroups');

        var useCase         = {};
        useCase.Name        = useCaseName;
        useCase.Year1       = 0;
        useCase.Year2       = 0;
        useCase.Year3       = 0;
        useCase.Year4       = 0;
        useCase.Year5       = 0;
        useCase.Total       = 0;
        useCase.Products    = [];

        familyGroups[sourceData.familyindex].UseCases.push(useCase);
        familyGroups[sourceData.familyindex].Dependencies.splice(useCaseIndex, 1);

        $C.set('v.familyGroups',familyGroups);

        var insert = $C.get('c.insertUseCase');
        insert.setParams({
            recordId : $C.get('v.recordId'),
            useCaseName : useCaseName,
            familyName : familyGroups[sourceData.familyindex].Name
        });
        insert.setCallback(this,function (response) {
            if (response.getState() === 'SUCCESS'){
                Object.keys(response.getReturnValue()['USECASEMAP'][useCaseName]).forEach(function (product){
                    var prod        = {};
                    prod.Family             = familyGroups[sourceData.familyindex].Name;
                    prod.UseCase            = useCaseName;
                    prod.Id                 = product.split(':')[2];
                    prod.PricebookEntryId   = product.split(':')[3];
                    prod.Name               = product.split(':')[1];
                    prod.Total              = 0;
                    prod.Entries            = response.getReturnValue()['USECASEMAP'][useCaseName][product];
                    prod.DiscountPercent    = false;

                    prod.Entries.forEach(function (entry){
                        entry.Success = 'success';
                        if (entry.Year__c){
                            familyGroups[sourceData.familyindex]['Year' + entry.Year__c] += entry.TotalPrice;
                            familyGroups[sourceData.familyindex].Total += entry.TotalPrice;
                            useCase['Year' + entry.Year__c] += entry.TotalPrice;
                            useCase.Total += entry.TotalPrice;
                        }
                    });
                    useCase.Products.push(prod);
                });

                familyGroups[sourceData.familyindex].UseCases[sourceData.familyIndex - 1] = useCase;
                $C.set('v.familyGroups',familyGroups);
                $H.calculateTotals($C,$E);

                window.setTimeout(
                    $A.getCallback(function() {
                        familyGroups[sourceData.familyindex].UseCases[sourceData.familyIndex - 1].Products.forEach(function(prod){
                            prod.Entries.forEach(function(entry){
                                entry.Success = '';
                            });
                        });

                        $C.set('v.familyGroups',familyGroups);
                    }), 800
                );
            }
        });

        $A.enqueueAction(insert);
    },
    updateLine : function($C,$E,$H){

        var sourceData      = $E.currentTarget.dataset;
        var familyGroups = $C.get('v.familyGroups');
        var lineItem   = familyGroups[sourceData.familyindex].UseCases[sourceData.usecaseindex].Products[sourceData.productindex].Entries[sourceData.entryindex];
        lineItem[sourceData.field] = ' pending ';
        $C.set('v.familyGroups',familyGroups);

        var editAction = $C.get('c.editLineItem');
        editAction.setParams({lineItem : {Id : lineItem.Id,UnitPrice : lineItem.UnitPrice, Quantity : lineItem.Quantity}});
        editAction.setCallback(this, function(response){

            if (response.getState() === 'SUCCESS'){
                lineItem[sourceData.field] = ' successInput ';
                $C.set('v.familyGroups',familyGroups);
                $H.calculateTotals($C,$E);
                window.setTimeout(
                    $A.getCallback(function() {
                        lineItem[sourceData.field] = ' ';
                        $C.set('v.familyGroups',familyGroups);
                    }), 800
                );
            } else {
                $H.showToast($C, 'Error', 'There was an error saving your update', 'error');
            }
        });
        $A.enqueueAction(editAction);
    },
    setDiscountToAmount : function($C,$E,$H) {
        var sourceData      = $E.currentTarget.dataset;
        var familyGroups    = $C.get('v.familyGroups');
        var entry           = familyGroups[sourceData.familyindex].UseCases[sourceData.usecaseindex].Products[sourceData.productindex].Entries[sourceData.entryindex];
        entry.UsesAmount__c = true;
        $C.set('v.familyGroups',familyGroups);
        var editAction = $C.get('c.editLineItem');
        editAction.setParams({lineItem : {Id : entry.Id,UsesAmount__c : true}});
        editAction.setCallback(this, function(response){
            if (response.getState() !== 'SUCCESS'){
                $H.showToast($C, 'Error', 'There was an error saving your update', 'error');
            }
        });
        $A.enqueueAction(editAction);
    },
    setDiscountToPercent : function($C,$E,$H) {
        var sourceData      = $E.currentTarget.dataset;
        var familyGroups    = $C.get('v.familyGroups');
        var entry           = familyGroups[sourceData.familyindex].UseCases[sourceData.usecaseindex].Products[sourceData.productindex].Entries[sourceData.entryindex];
        entry.UsesAmount__c = false;
        $C.set('v.familyGroups',familyGroups);
        var editAction = $C.get('c.editLineItem');
        editAction.setParams({lineItem : {Id : entry.Id,UsesAmount__c : false}});
        editAction.setCallback(this, function(response){
            if (response.getState() !== 'SUCCESS'){
                $H.showToast($C, 'Error', 'There was an error saving your update', 'error');
            }
        });
        $A.enqueueAction(editAction);
    },
    addProductLine : function($C,$E,$H){
        var sourceData      = $E.currentTarget.dataset;
        var familyGroups    = $C.get('v.familyGroups');
        var newLineItem     = {
            Quantity: 1,
            TotalPrice: 0,
            UnitPrice: 0,
            UsesAmount__c: false
        };

        familyGroups[sourceData.familyindex].UseCases[sourceData.usecaseindex].Products[sourceData.productindex].Entries.push(newLineItem);

        $C.set('v.familyGroups',familyGroups);

        var insert = $C.get('c.insertLineItem');
        insert.setParams({
            recordId : $C.get('v.recordId'),
            productId : sourceData.id,
            pricebookEntryId : sourceData.pricebookid,
            year : sourceData.week + 1
        });
        insert.setCallback(this,function (response) {
            if (response.getState() === 'SUCCESS'){
                var length      = familyGroups[sourceData.familyindex].UseCases[sourceData.usecaseindex].Products[sourceData.productindex].Entries.length;
                var product     = response.getReturnValue();
                product.Success = ' success ';
                familyGroups[sourceData.familyindex].UseCases[sourceData.usecaseindex].Products[sourceData.productindex].Entries[length -1] = product;
                $C.set('v.familyGroups',familyGroups);
                window.setTimeout(
                    $A.getCallback(function() {
                        familyGroups[sourceData.familyindex].UseCases[sourceData.usecaseindex].Products[sourceData.productindex].Entries[length -1].Success = '';
                        $C.set('v.familyGroups',familyGroups);
                        $H.calculateTotals($C,$E);
                    }), 800
                );
            } else {
                $H.showToast($C, 'Error', 'There was an error saving your update', 'error');
            }
        });

        $A.enqueueAction(insert);
    },
    deleteLine : function($C,$E,$H){

        var sourceData      = $E.currentTarget.dataset;
        var familyGroups    = $C.get('v.familyGroups');
        familyGroups[sourceData.familyindex].UseCases[sourceData.usecaseindex].Products[sourceData.productindex].Entries.splice(sourceData.entryindex,1);
        $C.set('v.familyGroups',familyGroups);

        var deleteAction = $C.get('c.deleteLineItem');
        deleteAction.setParams({itemId : sourceData.entryid});
        deleteAction.setCallback(this,function (response) {
            if (response.getState() === 'SUCCESS'){
                $H.calculateTotals($C,$E);
                $H.showToast($C, 'Success', 'Product removed ', 'success');
            } else {
                $H.showToast($C, 'Error', 'There was an error saving your update', 'error');
            }
        });

        $A.enqueueAction(deleteAction);
    },

    calculateDiscountPercent : function($C,$E,$H){
        var sourceData      = $E.currentTarget.dataset;
        var familyGroups    = $C.get('v.familyGroups');
        var entry           = familyGroups[sourceData.familyindex].UseCases[sourceData.usecaseindex].Products[sourceData.productindex].Entries[sourceData.entryindex];
        var discountAmount  = entry.DiscountAmount__c ? entry.DiscountAmount__c : 0;
        var total           = entry.UnitPrice * entry.Quantity -
            (entry.Discount ? ((entry.UnitPrice * entry.Quantity) * (entry.Discount / 100)) : 0);
        entry.Discount      = ((discountAmount / total) * 100).toFixed(2);
        entry.DiscountSuccess = ' pending ';
        $C.set('v.familyGroups',familyGroups);
        var editAction = $C.get('c.editLineItem');
        editAction.setParams({lineItem : {Id : entry.Id,DiscountAmount__c : entry.DiscountAmount__c, Discount : entry.Discount}});
        editAction.setCallback(this, function(response){
            console.log(response.getState());

            if (response.getState() === 'SUCCESS'){
                entry.DiscountSuccess = ' successInput ';
                $C.set('v.familyGroups',familyGroups);
                window.setTimeout(
                    $A.getCallback(function() {
                        entry.DiscountSuccess = ' ';
                        $C.set('v.familyGroups',familyGroups);
                    }), 800
                );
            } else {
                $H.showToast($C, 'Error', 'There was an error saving your update', 'error');
            }
        });
        $A.enqueueAction(editAction);
    },
    calculateDiscountAmount : function($C,$E,$H){
        var sourceData      = $E.currentTarget.dataset;
        var familyGroups    = $C.get('v.familyGroups');
        var entry           = familyGroups[sourceData.familyindex].UseCases[sourceData.usecaseindex].Products[sourceData.productindex].Entries[sourceData.entryindex];
        var discountPercent = entry.Discount ? entry.Discount : 0;
        var total           = entry.UnitPrice * entry.Quantity -
            (entry.Discount ? ((entry.UnitPrice * entry.Quantity) * (entry.Discount / 100)) : 0);
        entry.DiscountAmount__c  = (total * (discountPercent / 100)).toFixed(2);
        entry.DiscountSuccess = ' pending ';
        $C.set('v.familyGroups',familyGroups);
        $C.set('v.familyGroups',familyGroups);
        var editAction = $C.get('c.editLineItem');
        editAction.setParams({lineItem : {Id : entry.Id,DiscountAmount__c : entry.DiscountAmount__c, Discount : entry.Discount}});
        editAction.setCallback(this, function(response){
            console.log(response.getState());
            if (response.getState() === 'SUCCESS'){
                entry.DiscountSuccess = ' successInput ';
                $C.set('v.familyGroups',familyGroups);
                window.setTimeout(
                    $A.getCallback(function() {
                        entry.DiscountSuccess = ' ';
                        $C.set('v.familyGroups',familyGroups);
                    }), 800
                );
            } else {
                $H.showToast($C, 'Error', 'There was an error saving your update', 'error');
            }
        });
        $A.enqueueAction(editAction);
    },
    toggleVertical : function($C,$E,$H){
        $E.currentTarget.value = $C.get('v.vertical') === false ? 'on' : 'off';
        $C.set('v.vertical',!$C.get('v.vertical'));
    }
});