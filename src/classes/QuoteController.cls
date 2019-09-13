/**
 * Created by ronanwilliams on 2019-08-27.
 */

public class QuoteController {

    @AuraEnabled
    public static Map<String,Object> getProductLines(String recordId){

        Map<String,Object> responseMap          = new Map<String,Object>();
        Map<String,Set<String>> dependencyMap   = getDependencies();

        Map<String,Map<String,Map<String,List<Object>>>> familyUseCaseMap = new Map<String,Map<String,Map<String,List<Object>>>>();

        for (OpportunityLineItem lineItem : [SELECT Id, Name, Product2.Family, Product2.Use_Case__c, Term_Years__c,
                                                    Year__c, UsesAmount__c, DiscountAmount__c, Product2.Product_Code__c,
                                                    Product_Code__c, TotalPrice, Discount, UnitPrice, Product2Id,
                                                    PricebookEntryId, Quantity, Product2.Name
                                            FROM OpportunityLineItem
                                            WHERE OpportunityId = :recordId
                                            ORDER BY Product2.Family, Product2.Use_Case__c, Year__c ASC]){

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

            dependencyMap.get(lineItem.Product2.Family).remove(lineItem.Product2.Use_Case__c);
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

            system.debug('entry is ' + entry);

            if (entry.isActive()){
                productUseCases.add(entry.getValue());
            }
        }

        responseMap.put('USECASES',productUseCases);
        responseMap.put('DEPENDENCIES',dependencyMap);


        return responseMap;
    }


    @AuraEnabled
    public static OpportunityLineItem insertLineItem(String recordId, String productId, String pricebookEntryId, Integer year){

        OpportunityLineItem newLineItem = new OpportunityLineItem();
        newLineItem.OpportunityId       = recordId;
        newLineItem.Product2Id          = productId;
        newLineItem.Year__c             = year;
        newLineItem.UnitPrice           = [SELECT UnitPrice FROM PricebookEntry WHERE Id = :pricebookEntryId].UnitPrice;
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

    @AuraEnabled
    public static Boolean deleteLineItem(String itemId){

        delete new OpportunityLineItem(Id = itemId);
        return true;

    }

    @AuraEnabled
    public static Boolean editLineItem(OpportunityLineItem lineItem){

        update lineItem;
        return true;
    }

    @AuraEnabled
    public static Map<String,Object> insertUseCase(String recordId, String useCaseName, String familyName){

        String priceBookId          = [SELECT Pricebook2Id FROM Opportunity WHERE Id = :recordId].Pricebook2Id;
        String currencyCode         = [SELECT CurrencyIsoCode FROM Opportunity WHERE Id = :recordId].CurrencyIsoCode;
        Map<Id,Product2> products   = new Map<Id,Product2>([SELECT Id FROM Product2
                                                            WHERE Family = :familyName
                                                            AND Use_Case__c = :useCaseName]);

        Map<Id,String> pricebookMap = new Map<Id,String>();

        for (PricebookEntry entry : [SELECT Id, Product2Id, CurrencyIsoCode
                                        FROM PricebookEntry
                                        WHERE Pricebook2Id = :priceBookId
                                        AND Product2Id IN :products.keySet()
                                        AND CurrencyIsoCode = :currencyCode]){
            pricebookMap.put(entry.Product2Id,entry.Id);
        }

        Set<Id> lineItemIds = new Set<Id>();

        for (Product2 product : products.values()){
            OpportunityLineItem lineItem = new OpportunityLineItem(
                        OpportunityId       = recordId,
                        Product2Id          = product.Id,
                        Year__c             = 1,
                        UnitPrice           = 0,
                        Quantity            = 1,
                        Discount            = 0,
                        PricebookEntryId    = pricebookMap.get(product.Id),
                        UsesAmount__c       = false,
                        DiscountAmount__c   = 0
                );
            insert lineItem;
            lineItemIds.add(lineItem.Id);
        }

        Map<String,Object> responseMap = new Map<String,Object>();


        Map<String,Map<String,List<Object>>> useCaseMap = new Map<String,Map<String,List<Object>>>();

        for (OpportunityLineItem lineItem : [SELECT Id, Name, Product2.Family, Product2.Use_Case__c, Term_Years__c,
                                                    Year__c, UsesAmount__c, DiscountAmount__c, Product2.Product_Code__c,
                                                    Product_Code__c, TotalPrice, Discount, UnitPrice, Product2Id,
                                                    PricebookEntryId, Quantity, Product2.Name
                                            FROM OpportunityLineItem
                                            WHERE Id IN :lineItemIds
                                            ORDER BY Year__c ASC]){

            String productIdentifier = lineItem.Product_Code__c + ': ' + lineItem.Product2.Name + ':' + lineItem.Product2Id + ':' + lineItem.PricebookEntryId;

            if (!useCaseMap.containsKey(lineItem.Product2.Use_Case__c)){
                useCaseMap.put(lineItem.Product2.Use_Case__c, new Map<String,List<Object>>());
            }

            if (!useCaseMap.get(lineItem.Product2.Use_Case__c).containsKey(productIdentifier)){
                useCaseMap.get(lineItem.Product2.Use_Case__c).put(productIdentifier, new List<Object>());
            }

            useCaseMap.get(lineItem.Product2.Use_Case__c).get(productIdentifier).add(lineItem);
        }

        responseMap.put('USECASEMAP',useCaseMap);

        return responseMap;

    }

    private static Map<String,Set<String>> getDependencies(){

        Map<String,Set<String>> dependencyMap = new Map<String,Set<String>>();

        for (Product2 prod : [SELECT Use_Case__c, Family FROM Product2]){
            if (!dependencyMap.containsKey(prod.Family)){
                dependencyMap.put(prod.Family, new Set<String>());
            }
            dependencyMap.get(prod.Family).add(prod.Use_Case__c);
        }

        return dependencyMap;
    }

}