/**
 * Created by ronanwilliams on 2019-08-27.
 */

public class QuoteController {

    @AuraEnabled
    public static Map<String,Object> getProductLines(String recordId){

        Map<String,Object> responseMap = new Map<String,Object>();


        Map<String,Map<String,Map<String,List<Object>>>> familyUseCaseMap = new Map<String,Map<String,Map<String,List<Object>>>>();

        for (OpportunityLineItem lineItem : [SELECT Id, Name, Product2.Family, Product2.Use_Case__c, Term_Years__c,
                                                    Year__c, Product2.Product_Code__c, Product_Code__c
                                            FROM OpportunityLineItem
                                            WHERE OpportunityId = :recordId
                                            ORDER BY Year__c ASC]){

            lineItem.Product2.Use_Case__c = 'UC' + lineItem.Product2.Family;

            if (!familyUseCaseMap.containsKey(lineItem.Product2.Family)){
                familyUseCaseMap.put(lineItem.Product2.Family, new Map<String,Map<String,List<Object>>>());
            }

            if (!familyUseCaseMap.get(lineItem.Product2.Family).containsKey(lineItem.Product2.Use_Case__c)){
                familyUseCaseMap.get(lineItem.Product2.Family).put(lineItem.Product2.Use_Case__c, new Map<String,List<Object>>());
            }

            if (!familyUseCaseMap.get(lineItem.Product2.Family).get(lineItem.Product2.Use_Case__c).containsKey(lineItem.Product_Code__c)) {
                familyUseCaseMap.get(lineItem.Product2.Family).get(lineItem.Product2.Use_Case__c).put(lineItem.Product_Code__c, new List<Object>());
            }

            familyUseCaseMap.get(lineItem.Product2.Family).get(lineItem.Product2.Use_Case__c).get(lineItem.Product_Code__c).add(lineItem);
        }

        responseMap.put('FAMILYGROUPS',familyUseCaseMap);

//        Map<String,Set<String>> productFamilies =
        List<String> productFamilies            = new List<String>();
        Schema.DescribeFieldResult familyVals   = Product2.Family.getDescribe();
        List<Schema.PicklistEntry> entries      = familyVals.getPicklistValues();

        for (Schema.PicklistEntry entry : entries){
            if (entry.isActive() && !familyUseCaseMap.containsKey(entry.getValue())){
                productFamilies.add(entry.getValue());
            }
        }

        responseMap.put('FAMILIES',productFamilies);

        return responseMap;
    }


    @AuraEnabled
    public static ProductFamily__c createProductFamily(String recordId, String familyName){

        return null;

    }

}