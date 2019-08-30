/**
 * Created by ronanwilliams on 2019-08-27.
 */

({

    afterRender : function($C,$H) {
        var listInputCmp    = $C.find("codelistInput");
        var listInput       = listInputCmp.getElement();
        listInput.setAttribute("list", $C.get('v.recordId'));

        var otherListInputCmp = $C.find("codelistInput2");

        console.log(otherListInputCmp);

        // otherListInputCmp.forEach(function(list){
        //     var listContent = list.getElement();
        //     listContent.setAttribute("list",$C.get('v.recordId'));
        // })

    }

});