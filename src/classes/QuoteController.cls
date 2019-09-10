/**
 * Created by ronanwilliams on 2019-08-27.
 */

public class QuoteController {

    @AuraEnabled
    public static Map<String,Object> getProductLines(String recordId){

        Map<String,Object> responseMap = new Map<String,Object>();


        Map<String,Map<String,Map<String,List<Object>>>> familyUseCaseMap = new Map<String,Map<String,Map<String,List<Object>>>>();

        for (OpportunityLineItem lineItem : [SELECT Id, Name, Product2.Family, Product2.Use_Case__c, Term_Years__c,
                                                    Year__c, UsesAmount__c, DiscountAmount__c, Product2.Product_Code__c,
                                                    Product_Code__c, TotalPrice, Discount, UnitPrice, Product2Id,
                                                    PricebookEntryId, Quantity, Product2.Name
                                            FROM OpportunityLineItem
                                            WHERE OpportunityId = :recordId
                                            ORDER BY Year__c ASC]){

            lineItem.Product2.Use_Case__c = lineItem.Product2.Family;
            String productIdentifier = lineItem.Product_Code__c + ': ' + lineItem.Product2.Name + ':' + lineItem.Product2Id + ':' + lineItem.PricebookEntryId;


            if (!familyUseCaseMap.containsKey(lineItem.Product2.Family)){
                familyUseCaseMap.put(lineItem.Product2.Family, new Map<String,Map<String,List<Object>>>());
            }

            if (!familyUseCaseMap.get(lineItem.Product2.Family).containsKey(lineItem.Product2.Use_Case__c)){
                familyUseCaseMap.get(lineItem.Product2.Family).put(lineItem.Product2.Use_Case__c, new Map<String,List<Object>>());
            }

            if (!familyUseCaseMap.get(lineItem.Product2.Family).get(lineItem.Product2.Use_Case__c).containsKey(productIdentifier)) {
                familyUseCaseMap.get(lineItem.Product2.Family).get(lineItem.Product2.Use_Case__c).put(productIdentifier, new List<Object>());
            }

            familyUseCaseMap.get(lineItem.Product2.Family).get(lineItem.Product2.Use_Case__c).get(productIdentifier).add(lineItem);
        }

        responseMap.put('FAMILYGROUPS',familyUseCaseMap);

        List<String> productFamilies            = new List<String>();
        Schema.DescribeFieldResult familyVals   = Product2.Family.getDescribe();
        List<Schema.PicklistEntry> entries      = familyVals.getPicklistValues();

        for (Schema.PicklistEntry entry : entries){
            if (entry.isActive() && !familyUseCaseMap.containsKey(entry.getValue())){
                productFamilies.add(entry.getValue());
            }
        }

        responseMap.put('FAMILIES',productFamilies);

        List<String> productUseCases                = new List<String>();
        Schema.DescribeFieldResult useCaseVals      = Product2.Use_Case__c.getDescribe();
        List<Schema.PicklistEntry> useCaseEntries   = useCaseVals.getPicklistValues();

        for (Schema.PicklistEntry entry : useCaseEntries){
            if (entry.isActive()){
                productUseCases.add(entry.getValue());
            }
        }

        responseMap.put('USECASES',productUseCases);

        return responseMap;
    }


    @AuraEnabled
    public static OpportunityLineItem insertLineItem(String recordId, String productId, String pricebookEntryId, Integer year){

        OpportunityLineItem newLineItem = new OpportunityLineItem();
        newLineItem.OpportunityId       = recordId;
        newLineItem.Product2Id          = productId;
        newLineItem.Year__c             = year;
        newLineItem.UnitPrice           = 0;
        newLineItem.Quantity            = 1;
        newLineItem.Discount            = 0;
        newLineItem.PricebookEntryId    = pricebookEntryId;
        newLineItem.UsesAmount__c       = false;
        newLineItem.DiscountAmount__c   = 0;

        insert newLineItem;

        return [SELECT Id, Name, Product2.Family, Product2.Use_Case__c, Term_Years__c,
                        Year__c, UsesAmount__c, DiscountAmount__c, Product2.Product_Code__c,
                        Product_Code__c, TotalPrice, Discount, UnitPrice, Product2Id,
                        PricebookEntryId, Quantity, Product2.Name
                FROM OpportunityLineItem
                WHERE Id = :newLineItem.Id];

    }

}