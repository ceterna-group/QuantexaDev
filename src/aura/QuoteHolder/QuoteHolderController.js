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
            }


        });
        $A.enqueueAction(getInfo);

    }

});