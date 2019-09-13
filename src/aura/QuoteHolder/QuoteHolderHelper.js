/**
 * Created by ronanwilliams on 2019-09-13.
 */

({
    calculateTotals : function($C,$E){

        var familyGroups = $C.get('v.familyGroups');

        // console.log('setting totals');
        familyGroups.forEach(function(family) {
            family.Year1    = 0;
            family.Year2    = 0;
            family.Year3    = 0;
            family.Year4    = 0;
            family.Year5    = 0;
            family.Total    = 0;
            family.UseCases.forEach(function (useCase) {
                useCase.Year1   = 0;
                useCase.Year2   = 0;
                useCase.Year3   = 0;
                useCase.Year4   = 0;
                useCase.Year5   = 0;
                useCase.Total   = 0;
                useCase.Products.forEach(function (product) {
                    product.Total   = 0;
                    product.Entries.forEach(function (entry) {
                        if (entry.Year__c) {
                            var totalPrice = entry.UnitPrice * entry.Quantity -
                                (entry.Discount ? ((entry.UnitPrice * entry.Quantity) *
                                    (entry.Discount / 100)) : 0);
                            family['Year' + entry.Year__c] += totalPrice;
                            family.Total += totalPrice;
                            useCase['Year' + entry.Year__c] += totalPrice;
                            useCase.Total += totalPrice;
                            product.Total += totalPrice;
                        }
                    });
                });
            });
        });
        $C.set('v.familyGroups',familyGroups);
    }
});