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


                    var family      = {};
                    family.Name     = group;
                    family.Year1    = 0;
                    family.Year2    = 0;
                    family.Year3    = 0;
                    family.Year4    = 0;
                    family.Year5    = 0;
                    family.Total    = 0;
                    family.UseCases = [];

                    // console.log(response.getReturnValue()['FAMILYGROUPS'][group]);

                    Object.keys(response.getReturnValue()['FAMILYGROUPS'][group]).forEach(function(caseName){

                        // console.log('case name is ' + caseName);


                        var useCase         = {};
                        useCase.Name        = caseName;
                        // useCase.Year1       = 0;
                        // useCase.Year2       = 0;
                        // useCase.Year3       = 0;
                        // useCase.Year4       = 0;
                        // useCase.Year5       = 0;
                        // useCase.Total       = 0;
                        useCase.Products    = [];

                        Object.keys(response.getReturnValue()['FAMILYGROUPS'][group][caseName]).forEach(function(product){
                            var prod        = {};
                            prod.Family             = group;
                            prod.UseCase            = caseName;
                            prod.Id                 = product.split(':')[2];
                            prod.PricebookEntryId   = product.split(':')[3];
                            prod.Name               = product.split(':')[0] + ': ' + product.split(':')[1];
                            prod.Entries            = response.getReturnValue()['FAMILYGROUPS'][group][caseName][product];
                            useCase.Products.push(prod);

                            prod.Entries.forEach(function (entry){
                                if (entry.Year__c){
                                    family['Year' + entry.Year__c] += entry.TotalPrice;
                                }
                               console.log(entry);
                            });

                            // productLines.push(product);
                        });

                        // console.log('products');
                        // console.log(useCase.Products);

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

    }

});