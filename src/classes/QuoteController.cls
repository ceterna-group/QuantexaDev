/**
 * Created by ronanwilliams on 2019-08-27.
 */

public class QuoteController {

    @AuraEnabled
    public static Map<String,Object> getProductLines(String recordId){

        Map<String,Object> responseMap = new Map<String,Object>();

        List<String> productFamilies            = new List<String>();
        Schema.DescribeFieldResult familyVals   = Product2.Family.getDescribe();
        List<Schema.PicklistEntry> entries      = familyVals.getPicklistValues();

        for (Schema.PicklistEntry entry : entries){
            if (entry.isActive()){
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