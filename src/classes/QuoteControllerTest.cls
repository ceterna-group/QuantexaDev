/**
 * Created by ronanwilliams on 2019-10-03.
 */

@IsTest
public class QuoteControllerTest {

    @TestSetup
    public static void doSetup(){

        // insert account
        Account acc     = new Account();
        acc.Name        = 'Test';
        insert acc;

        // insert contact
        Contact con     = new Contact();
        con.FirstName   = 'Test';
        con.LastName    = 'Test';
        con.AccountId   = acc.Id;

        // insert opportunity
        Opportunity opp = new Opportunity();
        opp.CloseDate   = Date.today();
        opp.Name        = 'Test';
        opp.AccountId   = acc.Id;
        opp.Primary_Contact__c = con.Id;
        opp.StageName   = 'In Progress';
        opp.ForecastCategoryName = 'Upside';
        opp.Pricebook2Id = Test.getStandardPricebookId();
        insert opp;

        Product2 prod1  = new Product2();
        prod1.Name      = 'Public Training Product';
        prod1.Family    = 'Risk';
        prod1.Use_Case__c = 'Customer Insight';
        insert prod1;

        PricebookEntry entry = new PricebookEntry();
        entry.Pricebook2Id = Test.getStandardPricebookId();
        entry.Product2Id = prod1.Id;
        entry.UnitPrice = 100;
        entry.IsActive  = true;
        insert entry;


    }


    @IsTest
    public static void test(){

        String recordId     = [SELECT Id FROM Opportunity LIMIT 1].Id;
        String productId    = [SELECT Id FROM Product2 LIMIT 1].Id;
        String pricebookEntryId = [SELECT Id FROM PricebookEntry WHERE Product2Id = :productId AND Pricebook2Id = :Test.getStandardPricebookId()].Id;


        QuoteController.insertLineItem(recordId,productId,pricebookEntryId,1);

        QuoteController.getProductLines(recordId);

        QuoteController.editLineItem([SELECT Id FROM OpportunityLineItem LIMIT 1]);
        QuoteController.deleteLineItem([SELECT Id FROM OpportunityLineItem LIMIT 1].Id);
    }



    @IsTest
    public static void test3(){

        String recordId     = [SELECT Id FROM Opportunity LIMIT 1].Id;

        QuoteController.insertUseCase(recordId, 'Customer Insight','Risk');
    }

}