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


                $C.set('v.families',response.getReturnValue()['FAMILIES']);
                $C.set('v.useCases',response.getReturnValue()['USECASES']);

                var familyGroups = [];
                var productLines = [];

                Object.keys(response.getReturnValue()['FAMILYGROUPS']).forEach(function(group){

                    console.log('processing ' + group);

                    var family      = {};
                    family.Name     = group;
                    family.Year1    = 0;
                    family.Year2    = 0;
                    family.Year3    = 0;
                    family.Year4    = 0;
                    family.Year5    = 0;
                    family.Total    = 0;
                    family.UseCases = [];

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
                            // prod.Name               = product.split(':')[0] + ': ' + product.split(':')[1];
                            prod.Name               = product.split(':')[1];
                            prod.Entries            = response.getReturnValue()['FAMILYGROUPS'][group][caseName][product];
                            prod.DiscountPercent    = false;
                            useCase.Products.push(prod);

                            prod.Entries.forEach(function (entry){
                                if (entry.Year__c){
                                    family['Year' + entry.Year__c] += entry.TotalPrice;
                                    family.Total += entry.TotalPrice;
                                    useCase['Year' + entry.Year__c] += entry.TotalPrice;
                                    useCase.Total += entry.TotalPrice;
                                }
                               console.log(entry);
                            });
                        });

                        family.UseCases.push(useCase);
                    });

                    familyGroups.push(family);
                });
                $C.set('v.familyGroups',familyGroups);
                $C.set('v.productLines',productLines);

                console.log(familyGroups);

            }


        });
        $A.enqueueAction(getInfo);

    },
    createFamily : function($C,$E,$H){

        var familyName  = $C.find('codelistInput').getElement().value;
        var familyGroups = $C.get('v.familyGroups');
        var family      = {};
        family.Name     = familyName;
        family.Year1    = 0;
        family.Year2    = 0;
        family.Year3    = 0;
        family.Year4    = 0;
        family.Year5    = 0;
        family.Total    = 0;
        family.UseCases = [];
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

        var useCase = $E.currentTarget.value;
        var familyIndex = $E.currentTarget.dataset.familyindex;

        var familyGroups = $C.get('v.familyGroups');

        familyGroups[familyIndex].UseCases.push({});

        $C.set('v.familyGroups',familyGroups);
        console.log($E.currentTarget.value);

    },

    addProductLine : function($C,$E,$H){


        var sourceData = $E.currentTarget.dataset;


        console.log(sourceData.id);
        console.log(sourceData.week);


        // console.log(source);

        var insert = $C.get('c.insertLineItem');
        insert.setParams({
            recordId : $C.get('v.recordId'),
            productId : sourceData.id,
            pricebookEntryId : sourceData.pricebookEntryId,
            year : sourceData.week
        });
        insert.setCallback(this,function (response) {


            console.log(response.getReturnValue());



        });

        $A.enqueueAction(insert);

    },
    addProductLineHorizontal : function($C,$E,$H){
        var sourceData = $E.currentTarget.dataset;


        console.log(Object.keys(sourceData));
        console.log(Object.values(sourceData));
        console.log(sourceData.week);


        var familyGroups = $C.get('v.familyGroups');

        console.log('length si ' + familyGroups.length + ' and index is ' + sourceData.familyindex);


        var newLineItem = {

            // Id: "00k0E000004wWvwQAE",
            // Name: "testSaasLicense1 Correspondent Banking AML",
            // PricebookEntryId: "01u0Y000004JA4AQAW",
            // Product2Id: "01t0Y000005LxpyQAC",
            // Product_Code__c: "IG",
            Quantity: 1,
            TotalPrice: 100,
            UnitPrice: 100,
            UsesAmount__c: false

        };

        //
        familyGroups[sourceData.familyindex].UseCases[sourceData.usecaseindex].Products[sourceData.productindex].Entries.push(newLineItem);
        //
        //
        $C.set('v.familyGroups',familyGroups);

        // console.log(source);

        var insert = $C.get('c.insertLineItem');
        insert.setParams({
            recordId : $C.get('v.recordId'),
            productId : sourceData.id,
            pricebookEntryId : sourceData.pricebookid,
            year : sourceData.week
        });
        insert.setCallback(this,function (response) {


            familyGroups[sourceData.familyindex].UseCases[sourceData.usecaseindex].Products[sourceData.productindex].Entries[sourceData.week -2] = response.getReturnValue();

            console.log(response.getReturnValue());

            $C.set('v.familyGroups',familyGroups);


        });

        $A.enqueueAction(insert);
    },
    setUsesAmount : function($C,$E,$H) {
        var sourceData = $E.currentTarget.dataset;
        var familyGroups = $C.get('v.familyGroups');


        familyGroups[sourceData.familyindex].UseCases[sourceData.usecaseindex].Products[sourceData.productindex].Entries[sourceData.entryindex].UsesAmount__c =
            !familyGroups[sourceData.familyindex].UseCases[sourceData.usecaseindex].Products[sourceData.productindex].Entries[sourceData.entryindex].UsesAmount__c;
        $C.set('v.familyGroups',familyGroups);
    },

    toggleVertical : function($C,$E,$H){
        $E.currentTarget.value = $C.get('v.vertical') === false ? 'on' : 'off';
        $C.set('v.vertical',!$C.get('v.vertical'));
    }

});