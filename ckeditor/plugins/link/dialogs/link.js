﻿/*
    Copyright (c) 2003-2012, CKSource - Frederico Knabben. All rights reserved.
For licensing, see LICENSE.html or http://ckeditor.com/license
*/

var update_ckgeditInternalLink, update_ckgeditMediaLink;
var fckgInternalInputId, fckgMediaInputId,ckgeditIwikiData, ckgeditIwikiIndex;
 var ck_m_files_protocol, ckg_dialog;
 window.onbeforeunload = function() { };
   
CKEDITOR.dialog.add( 'link', function( editor )
{
    oDokuWiki_FCKEditorInstance.Lang = editor.lang;
    ck_m_files_protocol =  oDokuWiki_FCKEditorInstance.mfiles ?	[ 'm-files://\u200E', 'm-files://' ] : "";    
    var Doku_Base = oDokuWiki_FCKEditorInstance.dwiki_doku_base;
	var plugin = CKEDITOR.plugins.link;
    var oRegex = new Object() ;
    oRegex.doku_base = new RegExp('^' + Doku_Base.replace(/\//g,'\\/'),'g');
    oRegex.media_internal = /lib\/exe\/fetch\.php\/(.*)/;
    oRegex.media_rewrite_1 = /^_media\/(.*)/;
    oRegex.media_rewrite_1Doku_Base = new RegExp('^' + Doku_Base + '_media\/(.*)');    
    oRegex.media_rewrite_2=/exe\/fetch.php\?media=(.*)/;
    oRegex.internal_link = /doku.php\?id=(.*)/;
    oRegex.internal_link_rewrite_2 = /doku.php\/(.*)/;
    oRegex.internal_link_rewrite_1 = new RegExp('^' + Doku_Base + '(?!_media)(.*)');    
    oRegex.samba =/file:\/\/\/\/\/(.*)/;
    oRegex.interwiki = /^(.*?)oIWIKIo(.*?)cIWIKIc/;    
	oRegex.samba_unsaved =/^\\\\\w+(\\\w.*)/;	    
    ckg_dialog = CKEDITOR.dialog;
	 var fckgSMBInputId;
     var defaultFBLang = {
        InternalLink: "internal link",
        InternalMedia: "internal media",
        MediaFileLink: "link to media file",
        SMBLabel: "Samba Share",
        GetHeadingsLabel: 'Get Headings'	,
        QStringLabel: 'Query String (For example: value_1=1&value_2=2) ',	
        ResetQS: 'Reset Query String',
        NotSetOption: 'Not Set',
        AdvancedInfo: "To create anchors from Dokuwiki headers, click on the Get Headings button, select the header, click OK. You can go back, select a new page and get new headers.",
        AdvancedTabPrompt: 'Use the advanced tab to create page anchors and query strings',
        SMBExample: "Enter your share as: \\\\Server\\directory\\file", 
        InterWikiLink: "Interwiki Link",
        InterWikiType: "Interwiki Type",
        InterwikiPlaceHolder: "Interwiki Place Holder",
        InterwikiInfo: "<div style='max-width:350px; white-space: pre-wrap;border:1px solid #cccccc; margin:auto; overflow:auto; padding:4px;line-height:125%;'>Dokuwiki\'s " +
        "interwiki links are short-cuts which look like this: <span style='font-weight:600'>[[wp&gt;Shakespeare]]</span>, which will create a link to the English Wikipedia article on Shakespeare.  " +
        "The <span style='font-weight:600'>wp</span> part designates a link pattern;  " + 
        "the text following the '<span style='font-weight:900'>&gt;</span>' will be inserted into the link, replacing  a place holder, which is enclosed in curly brackets, "  +
        "as in <span style='font-weight:600'>{NAME}</span>. When there is no place holder, the text will be appended to the end of the link.</div>",
        MediaFileLink: "link to media file",
     };   
     var fck_Lang = editor.lang.fbrowser ? editor.lang.fbrowser : defaultFBLang;
    
    var  translateItem = function (js_code) {     
      if(fck_Lang[js_code] && fck_Lang[js_code] != "") {
            return fck_Lang[js_code];
      }  
      return defaultFBLang[js_code];
    }   ; 
    
    var getIwikiOptions = function() {
        var retv;
         jQuery.ajax(
          DOKU_BASE + 'lib/exe/ajax.php',
          {
            data:
              {
                call: 'iwiki_list'
              },
            type: "POST",
            async: false,
            dataType: "json",
            success: function(data, textStatus, jqXHR)
              {
                  retv = data;
              },
            error: function(jqXHR, textStatus, errorThrown )
              {
                alert(textStatus);
                alert(errorThrown);
              }
          }
        ); 
        return retv;
  
		
    };
    var getInternalHeaders = function() {     
    
	  var dialog = this.getDialog();	
      var select_id = dialog.getContentElement('advanced', 'internalAnchor').getInputElement().$.id;          
      var select =document.getElementById(select_id);
      var wiki_id = dialog.getContentElement('info', 'internal').getInputElement().$.id;  
      wiki_id = document.getElementById(wiki_id).value;        
      if(!wiki_id) return;
      
      var anchorOption = {
        push: function(title, value) { 
           this.stack[this.Index] = (new Option(title,value,false,false));
           this.Index++;
        },
        Index: 0,
        stack: undefined,
        selection: "",
        ini: function(title) {
          this.stack = select.options;
          this.stack.length = 0;
          this.Index = 0;    
          this.push(title,'');     
        }
    };
    
        var params="dw_id=" +wiki_id;
        editor.config.jquery.post(
                editor.config.ckedit_path + "get_headers.php",
                params,
                function (data,status) { 
                    if(status=="success") {                       
                         var str = decodeURIComponent(data);                              
                         if(str.match(/^\s*__EMPTY__\s*$/)) {
                                anchorOption.ini('No Headers Found');
                                anchorOption.selection = "";
                                return;
                         }
                           anchorOption.ini('Headings Menu');                        
                           var pairs = str.split('@@');
                            for (var i in pairs) {
                                  var elems = pairs[i].split(/;;/);
                                  anchorOption.push(elems[0],elems[1]);
                             }                          
                        }
                    },                
                'html'
            );
	};	  
    
var useHeading = function(wiki_id) {
        var retv = wiki_id;
        var debug = 0;
         var params="dw_id=" +encodeURIComponent(wiki_id);
         editor.config.jquery.ajax({
           url: editor.config.ckedit_path + "useheading.php",
           async: false,
           data: params,    
           type: 'POST',
           dataType: 'html',         
           success: function(data){                 
               if(debug) {            
                  alert(data);
               }              
               retv = decodeURIComponent(data);  
      },
      error: function (XMLHttpRequest, textStatus, errorThrown) {
            retv = wiki_id;
        }
    });
    return retv;
};

  
  var getSMBInput = function ()   {  return fckgSMBInputId; };
  var ckg_iwikiClass;
	// Handles the event when the "Type" selection box is changed.
	var linkTypeChanged = function()
	{
    
      oDokuWiki_FCKEditorInstance.isLocalDwikiBrowser = false;
      oDokuWiki_FCKEditorInstance.isUrlExtern = false;       
      oDokuWiki_FCKEditorInstance.isDwikiMediaFile = false;
		var dialog = this.getDialog(),
			partIds = [ 'urlOptions', 'anchorOptions', 'emailOptions','internalOptions','mediaOptions','sambaOptions','interwikiOptions' ],
			typeValue = this.getValue(),
			uploadTab = dialog.definition.getContents( 'upload' ),
			uploadInitiallyHidden = uploadTab && uploadTab.hidden;

         dialog.hidePage( 'advanced' );		//Hide Advanded tab.   
         if(typeValue == 'internal') {
            oDokuWiki_FCKEditorInstance.isLocalDwikiBrowser = true;
           dialog.showPage('advanced');
         }
         else if(typeValue == 'media') {
            oDokuWiki_FCKEditorInstance.isDwikiMediaFile = true;
         } 

		if ( typeValue == 'url' )
		{
            oDokuWiki_FCKEditorInstance.isUrlExtern = true;            

			if ( !uploadInitiallyHidden )
				dialog.showPage( 'upload' );
		}
		else
		{
			//dialog.hidePage( 'target' );
			if ( !uploadInitiallyHidden )
				dialog.hidePage( 'upload' );
		}

 
		for ( var i = 0 ; i < partIds.length ; i++ )
		{
			var element = dialog.getContentElement( 'info', partIds[i] );          
			if ( !element )
				continue;

			element = element.getElement().getParent().getParent();         
			if ( partIds[i] == typeValue + 'Options' )
				element.show();
			else
				element.hide();
		}

		dialog.layout();

       };

	// Loads the parameters in a selected link to the link dialog fields.
	var javascriptProtocolRegex = /^javascript:/,
		emailRegex = /^mailto:([^?]+)(?:\?(.+))?$/,
		emailSubjectRegex = /subject=([^;?:@&=$,\/]*)/,
		emailBodyRegex = /body=([^;?:@&=$,\/]*)/,
		anchorRegex = /^#(.*)$/,
		urlRegex = /^((?:http|https|ftp|news|m-files):\/\/)?(.*)$/,  
		selectableTargets = /^(_(?:self|top|parent|blank))$/,
		encodedEmailLinkRegex = /^javascript:void\(location\.href='mailto:'\+String\.fromCharCode\(([^)]+)\)(?:\+'(.*)')?\)$/,
		functionCallProtectedEmailLinkRegex = /^javascript:([^(]+)\(([^)]+)\)$/;
        var internalLinkRegex = /doku.php\?id=(.*)$/;
	var popupRegex =
		/\s*window.open\(\s*this\.href\s*,\s*(?:'([^']*)'|null)\s*,\s*'([^']*)'\s*\)\s*;\s*return\s*false;*\s*/;
	var popupFeaturesRegex = /(?:^|,)([^=]+)=(\d+|yes|no)/gi;
    
	var parseLink = function( editor, element )
	{  
		var href = ( element  && ( element.data( 'cke-saved-href' ) || element.getAttribute( 'href' ) ) ) || '',
		 	javascriptMatch,
			emailMatch,
			anchorMatch,
			urlMatch,
			retval = {};

		if ( ( javascriptMatch = href.match( javascriptProtocolRegex ) ) )
		{
			if ( emailProtection == 'encode' )
			{
				href = href.replace( encodedEmailLinkRegex,
						function ( match, protectedAddress, rest )
						{
							return 'mailto:' +
							       String.fromCharCode.apply( String, protectedAddress.split( ',' ) ) +
							       ( rest && unescapeSingleQuote( rest ) );
						});
			}
			// Protected email link as function call.
			else if ( emailProtection )
			{
				href.replace( functionCallProtectedEmailLinkRegex, function( match, funcName, funcArgs )
				{
					if ( funcName == compiledProtectionFunction.name )
					{
						retval.type = 'email';
						var email = retval.email = {};

						var paramRegex = /[^,\s]+/g,
							paramQuoteRegex = /(^')|('$)/g,
							paramsMatch = funcArgs.match( paramRegex ),
							paramsMatchLength = paramsMatch.length,
							paramName,
							paramVal;

						for ( var i = 0; i < paramsMatchLength; i++ )
						{
							paramVal = decodeURIComponent( unescapeSingleQuote( paramsMatch[ i ].replace( paramQuoteRegex, '' ) ) );
							paramName = compiledProtectionFunction.params[ i ].toLowerCase();
							email[ paramName ] = paramVal;
						}
						email.address = [ email.name, email.domain ].join( '@' );
					}
				} );
			}
		}

		if ( !retval.type )
		{
            var class_name =  element ? element.getAttribute( 'class' )  : ""; 
			if ( ( anchorMatch = href.match( anchorRegex ) ) )
			{
				retval.type = 'anchor';
				retval.anchor = {};
				retval.anchor.name = retval.anchor.id = anchorMatch[1];
			}
			// Protected email link as encoded string.
			else if ( ( emailMatch = href.match( emailRegex ) ) )
			{
				var subjectMatch = href.match( emailSubjectRegex ),
					bodyMatch = href.match( emailBodyRegex );

				retval.type = 'email';
				var email = ( retval.email = {} );
				email.address = emailMatch[ 1 ];
				subjectMatch && ( email.subject = decodeURIComponent( subjectMatch[ 1 ] ) );
				bodyMatch && ( email.body = decodeURIComponent( bodyMatch[ 1 ] ) );
			}
           else if((urlMatch = href.match(oRegex.media_internal)) || (urlMatch = href.match(oRegex.media_rewrite_1)) 
              || (urlMatch = href.match(oRegex.media_rewrite_2)) || (urlMatch = href.match(oRegex.media_rewrite_1Doku_Base))) {
                    retval.type = 'media';
                  	retval.url = {};
				    retval.url.protocol =  "";
					retval.url.url = "";
					retval.url.selected =urlMatch[1];
              }
            else if( (urlMatch = href.match( internalLinkRegex )) || ( urlMatch = href.match(oRegex.internal_link_rewrite_2)) 
                        || (urlMatch = href.match( oRegex.internal_link_rewrite_1 ))
                     ) 
            {
                    retval.type = 'internal';
                    retval.url = {};
					retval.url.selected =urlMatch[1];
				    retval.url.protocol = "";
				    retval.url.url = "";
                }
		    else if(urlMatch = href.match(oRegex.samba)) {
			     retval.type = 'samba';				 
				 retval.url = {};
				 retval.url.url = "";
				 retval.url.protocol = '';
				 retval.url.selected = '\\\\'+ urlMatch[1].replace(/\//g,"\\");

			}
			else if(urlMatch = href.match(oRegex.samba_unsaved)) {
			    retval.type = 'samba';
				retval.url = {};
				retval.url.url = "";
				retval.url.protocol = '';
			    retval.url.selected = urlMatch[0];
			}
			else if( urlMatch = href.match(oRegex.interwiki) || class_name.match(/interwiki/) ) {
                var str = ""; 
                if(urlMatch && urlMatch[2]) {              
                   str =  decodeURIComponent(urlMatch[2]);       
                }
           
              	retval.url = {};
                ckg_iwikiClass = element.getAttribute( 'class' );  // save for interwiki  
                var  iw_select = ckg_dialog.getContentElement("info", 'iwiki_shortcut');    
                 var tmp = iw_select.getInputElement().$.id;
                 var select =document.getElementById(tmp);      
                 var match = ckg_iwikiClass.match(/iw_([^\s]+)/);                 
                 var index = match[1].replace(/_/,'.');
                 if(!str) {                   
                    var iwpattern =  ckgeditIwikiData[index];
                    iwpattern = iwpattern.replace(/\{\w+\}$/,"");
                    var regex = new RegExp(iwpattern + '\(.*\)');                   
                    match =  href.match(regex);
                    str = match[1];                   
                 }
                 index = ckgeditIwikiIndex[index];
                 if(index) {
                   select.selectedIndex = index;     
                 }
                 else select.selectedIndex = '0';                   
                iw_select.disable();                   
                retval.type = 'interwiki';              
                retval.url.selected =str;         
                retval.url.url = str;
             

            }
            
			// urlRegex matches empty strings, so need to check for href as well.
			else if (  href && ( urlMatch = href.match( urlRegex ) ) )
			{ 
                retval.type = 'url';
				retval.url = {};
				retval.url.protocol = urlMatch[1];
				retval.url.url = urlMatch[2];
			}
			else
				retval.type = 'url';
		}

		// Load target and popup settings.
		if ( element )
		{
			var target = element.getAttribute( 'target' );
			retval.target = {};
			retval.adv = {};
			var me = this;
		}
        
		// Record down the selected element in the dialog.
		this._.selectedElement = element;
		return retval;
        };
        
     var  insertInternalLinkText = function (text)
       {
           if(!text) return;
           document.getElementById(fckgInternalInputId).disabled = true;
           document.getElementById(fckgInternalInputId).style.fontWeight="bold" ;
           document.getElementById(fckgInternalInputId).style.backgroundColor="#DDDDDD" ;           
           text = text.replace(/^[\/\:]/,"");
           text =  text.replace(/\//g,':');             
           text = ':' + text; 
           document.getElementById(fckgInternalInputId).value = text; 
        };
        
    update_ckgeditInternalLink = insertInternalLinkText;

      var  insertMediaLinkText = function (text)
       {
           if(!text) return;
           text = text.replace(/^[\/\:]/,"");
           text =  text.replace(/\//g,':');             
           text = ':' + text; 
           document.getElementById(fckgMediaInputId).value = text; 
        };
   
     update_ckgeditMediaLink  =  insertMediaLinkText;   
     
     var fckg_display_obj = function(obj) {

      
        for(i in obj) {
         msg = i + "=" + obj[i];
         if(!confirm(msg))break;
       }
     };
     
	var setupParams = function( page, data )
	{
		if ( data[page] )
			this.setValue( data[page][this.id] || '' );
	};

	var setupPopupParams = function( data )
	{
		return setupParams.call( this, 'target', data );
	};

	var setupAdvParams = function( data )
	{
		return setupParams.call( this, 'adv', data );
	};
    
	var commitParams = function( page, data )
	{
		if ( !data[page] )
			data[page] = {};

		data[page][this.id] = this.getValue() || '';
	};

	var commitPopupParams = function( data )
	{
		return commitParams.call( this, 'target', data );
	};

	var commitAdvParams = function( data )
	{
		return commitParams.call( this, 'adv', data );
	};

	function unescapeSingleQuote( str )
	{
		return str.replace( /\\'/g, '\'' );
	}

	function escapeSingleQuote( str )
	{
		return str.replace( /'/g, '\\$&' );
	}

	var emailProtection = editor.config.emailProtection || '';

	// Compile the protection function pattern.
	if ( emailProtection && emailProtection != 'encode' )
	{
		var compiledProtectionFunction = {};

		emailProtection.replace( /^([^(]+)\(([^)]+)\)$/, function( match, funcName, params )
		{
			compiledProtectionFunction.name = funcName;
			compiledProtectionFunction.params = [];
			params.replace( /[^,\s]+/g, function( param )
			{
				compiledProtectionFunction.params.push( param );
			} );
		} );
	}

	function protectEmailLinkAsFunction( email )
	{
		var retval,
			name = compiledProtectionFunction.name,
			params = compiledProtectionFunction.params,
			paramName,
			paramValue;

		retval = [ name, '(' ];
		for ( var i = 0; i < params.length; i++ )
		{
			paramName = params[ i ].toLowerCase();
			paramValue = email[ paramName ];

			i > 0 && retval.push( ',' );
			retval.push( '\'',
						 paramValue ?
						 escapeSingleQuote( encodeURIComponent( email[ paramName ] ) )
						 : '',
						 '\'');
		}
		retval.push( ')' );
		return retval.join( '' );
	}

	function protectEmailAddressAsEncodedString( address )
	{
		var charCode,
			length = address.length,
			encodedChars = [];
		for ( var i = 0; i < length; i++ )
		{
			charCode = address.charCodeAt( i );
			encodedChars.push( charCode );
		}
		return 'String.fromCharCode(' + encodedChars.join( ',' ) + ')';
	}

	function getLinkClass( ele )
	{
		var className = ele.getAttribute( 'class' );
		return className ? className.replace( /\s*(?:cke_anchor_empty|cke_anchor)(?:\s*$)?/g, '' ) : '';
	}
 
	var commonLang = editor.lang.common,
		linkLang = editor.lang.link;
     
	return {
		title : linkLang.title,
		minWidth :  375, //350,
		minHeight : 250, //230,
		contents : [
			{
				id : 'info',
				label : linkLang.info,
				title : linkLang.info,
				elements :
				[
					{
						id : 'linkType',
						type : 'select',
						label : linkLang.type,
						'default' : 'url',
						items :
						[
							[ linkLang.toUrl, 'url' ],							
                            [ translateItem('InternalLink'), 'internal' ],
                            [translateItem('InternalMedia'), 'media' ],
							[ linkLang.toEmail, 'email' ],
							[ 'Samba share', 'samba' ]	,
                           [translateItem('InterWikiLink'), 'interwiki' ]	                            
						],
						onChange : linkTypeChanged,
						setup : function( data )
						{                      
							if ( data.type )
								this.setValue( data.type );                          
						},
						commit : function( data )
						{
							data.type = this.getValue();     

						}
					},

					{
						type : 'vbox',
						id : 'urlOptions',                      
						children :
						[
							{
								type : 'hbox',
								widths : [ '25%', '75%' ],
								children :
								[
									{
										id : 'protocol',
										type : 'select',
										label : commonLang.protocol,
										'default' : 'http://',
										items :
										[
											[ 'http://\u200E', 'http://' ],                                            
											[ 'https://\u200E', 'https://' ],
											[ 'ftp://\u200E', 'ftp://' ],
											[ 'news://\u200E', 'news://' ],
                                            ck_m_files_protocol    
										],
										setup : function( data )
										{
											if ( data.url )
												this.setValue( data.url.protocol || '' );
										},
										commit : function( data )
										{
											if ( !data.url )
												data.url = {};

											data.url.protocol = this.getValue();                                           
										}
									},
									{
										type : 'text',
										id : 'url',
										label : commonLang.url,
										required: true,
										onLoad : function ()
										{
											this.allowOnChange = true;
										},
										onKeyUp : function()
										{
											this.allowOnChange = false;
											var	protocolCmb = this.getDialog().getContentElement( 'info', 'protocol' ),
												url = this.getValue(),
                                                urlOnChangeProtocol = /^(http|https|ftp|news|m-files):\/\/(?=.)/i,
												urlOnChangeTestOther = /^((javascript:)|[#\/\.\?])/i;

											var protocol = urlOnChangeProtocol.exec( url );
											if ( protocol )
											{
												this.setValue( url.substr( protocol[ 0 ].length ) );
												protocolCmb.setValue( protocol[ 0 ].toLowerCase() );
											}
											else if ( urlOnChangeTestOther.test( url ) )
												protocolCmb.setValue( '' );

											this.allowOnChange = true;
										},
										onChange : function()
										{
											if ( this.allowOnChange )		// Dont't call on dialog load.
												this.onKeyUp();
										},
										validate : function()
										{
											var dialog = this.getDialog();

											if ( dialog.getContentElement( 'info', 'linkType' ) &&
													dialog.getValueOf( 'info', 'linkType' ) != 'url' )
												return true;

											if ( this.getDialog().fakeObj )	// Edit Anchor.
												return true;

											var func = CKEDITOR.dialog.validate.notEmpty( linkLang.noUrl );
											return func.apply( this );
										},
										setup : function( data )
										{                                       
											this.allowOnChange = false;
											if ( data.url )
												this.setValue( data.url.url );
											this.allowOnChange = true;

										},
										commit : function( data )
										{
											// IE will not trigger the onChange event if the mouse has been used
											// to carry all the operations #4724
											this.onChange();

											if ( !data.url )
												data.url = {};

											data.url.url = this.getValue();
											this.allowOnChange = false;
										}
									}

								],
								setup : function( data )
								{
									if ( !this.getDialog().getContentElement( 'info', 'linkType' ) )
										this.getElement().show();
								}
							},
						]

					},
					                    
					{
						type : 'vbox',					
                        id : 'internalOptions',
						children :
						[
							{
								type : 'button',
								id : 'browse1',
								hidden : 'true',
								filebrowser : 'info:url',
								label : commonLang.browseServer
							},
                            {
										type : 'text',
										id : 'internal',                                       
										label : translateItem('InternalLink'), //"internal link",
										required: true,
                                        setup : function( data )
                                        {                                           
                                           if(data) {    										   
                                            if (data.url &&  data.url.selected ) {                                        
                                                   var id = data.url.selected.replace(/^\:/,"");
                                                   this.setValue(':'+ id );
                                            }
                                           }
                                        },       
                            },
                            {
                                id: 'anchorsmsg',
                                type: 'html',
                                html: translateItem('AdvancedTabPrompt'), //'Use the advanced tab to create page anchors and query strings',
                             }                            
						]
					},

                   {
						type : 'vbox',					
                        id : 'interwikiOptions',
						children :
						[
                            {
										type : 'text',
										id : 'interwiki',                                       
										label : translateItem('InterwikiPlaceHolder'), //"interwiki link",
										required: true,
                                        setup : function( data )
                                        {                                           
                                           if(data) {    										   
                                            if (data.url &&  data.url.selected ) {                                         
                                                   var id = data.url.selected.replace(/^\:/,"");
                                                   this.setValue(id );
                                            }
                                           }
                                        },  
										commit : function( data )
										{
											if ( !data.url )
												data.url = {};                                           
											data.url.selection = this.getValue();                                                  
										},                                        
                            },
                           {
										id : 'iwiki_shortcut',
										type : 'select',
										label : translateItem('InterWikiType'),
										'default' : '',                                        
										items : 	
                                       [
                                            [ 'Not Set', 'Not-Set' ],                                            
                                        ]  ,  
                                       
										setup : function( data )
										{
											if ( data.url )
												this.setValue( data.url.iwiki_shortcut || '' );
										},
										commit : function( data )
										{
											if ( !data.url )
												data.url = {};                                           
											data.url.iwiki_shortcut = this.getValue();       
										},
                             } ,                           
                            {
                                id: 'iwikimsg',
                                type: 'html',
                                html:  translateItem('InterwikiInfo'),
                             } ,
						]
					},
                    
                    {
						type : 'vbox',					
                        id : 'mediaOptions',                        
						children :
						[
							{
								type : 'button',
								id : 'browse2',							
								filebrowser : 'info:url',
								label : commonLang.browseServer
							},
                            {
										type : 'text',
										id : 'media',
                                        //width: '24em',
										label :  translateItem('MediaFileLink'), //"link to media file",
										required: true,                                       
                                        setup : function( data )
                                        {                                           
                                           if(data) {                                            
                                            if (data.url &&  data.url.selected ) {
                                                   var id = data.url.selected.replace(/^\:/,"");
                                                   this.setValue(':'+ id );
                                            }
                                           }
                                        },       
                            },              
						]
					},
					{
						type : 'vbox',					
                        id : 'sambaOptions',   						
						children :
						[
						    {
										type: 'html',
										id: 'smb_msg',
										html: translateItem('SMBExample'),	//"Enter your share as: \\\\Server\\directory\\file", 
							},
                            {
										type : 'text',
										id : 'samba',
                                        width: '50',
										label :  translateItem('SMBLabel'), //"Samba Share",												
										required: true,                                       
                                        setup : function( data )
                                        {                                           
                                            if (data.url && data.url.selected) {                                                 
                                                   this.setValue(data.url.selected);
                                            }
                                        },       
                            },              
						]
					},

					{
						type :  'vbox',
						id : 'emailOptions',
						padding : 1,
						children :
						[
							{
								type : 'text',
								id : 'emailAddress',
								label : linkLang.emailAddress,
								required : true,
								validate : function()
								{
									var dialog = this.getDialog();

									if ( !dialog.getContentElement( 'info', 'linkType' ) ||
											dialog.getValueOf( 'info', 'linkType' ) != 'email' )
										return true;

									var func = CKEDITOR.dialog.validate.notEmpty( linkLang.noEmail );
									return func.apply( this );
								},
								setup : function( data )
								{
									if ( data.email )
										this.setValue( data.email.address );

									var linkType = this.getDialog().getContentElement( 'info', 'linkType' );
									if ( linkType && linkType.getValue() == 'email' )
										this.select();
								},
								commit : function( data )
								{
									if ( !data.email )
										data.email = {};

									data.email.address = this.getValue();
								}
							},
							{
								type : 'text',
								id : 'emailSubject',
								label : linkLang.emailSubject,
								setup : function( data )
								{
									if ( data.email )
										this.setValue( data.email.subject );
								},
								commit : function( data )
								{
									if ( !data.email )
										data.email = {};

									data.email.subject = this.getValue();
								}
							},
							{
								type : 'textarea',
								id : 'emailBody',
								label : linkLang.emailBody,
								rows : 3,
								'default' : '',
								setup : function( data )
								{
									if ( data.email )
										this.setValue( data.email.body );
								},
								commit : function( data )
								{
									if ( !data.email )
										data.email = {};

									data.email.body = this.getValue();
								}
							}
						],
						setup : function( data )
						{
							if ( !this.getDialog().getContentElement( 'info', 'linkType' ) )
								this.getElement().hide();
						}
					}
				]
			},

			{
				id : 'upload',
				label : linkLang.upload,
				title : linkLang.upload,
				hidden : true,
				filebrowser : 'uploadButton',
				elements :
				[
					{
						type : 'file',
						id : 'upload',
						label : commonLang.upload,
						style: 'height:40px',
						size : 29
					},
					{
						type : 'fileButton',
						id : 'uploadButton',
						label : commonLang.uploadSubmit,
						filebrowser : 'info:url',
						'for' : [ 'upload', 'upload' ]
					}
				]
			},
			{
				id : 'advanced',
				label : linkLang.advanced,
				title : linkLang.advanced,						
				elements :
				[
				    {  
					    id : 'msg',
						type: 'html',
						html: "<p style='max-width:350px; white-space: pre-wrap;'>" +
                        translateItem('AdvancedInfo')  +"</p>"
					},
					{
						id : 'internalAnchor',
						type : 'select',					
						'default' : '',
						items :
						[
							['Not Set' , '' ],				
						],					
						setup : function( data )
						{                      
							if ( data.hash )
								this.setValue( data.hash );
						},
						commit : function( data )
						{
							data.hash = this.getValue();                                 
						}
					},
                   {
                    type : 'button',                   
                    id : 'getheaders',									
                    onClick:  getInternalHeaders,
                    label : translateItem('GetHeadingsLabel'), //'Get Headings'	
                  },
                   {
                    type: 'html',
                    html: "<br />",
                   },
                   {
                    type : 'text',                   
                    id : 'queryString',		
                    label : translateItem('QStringLabel'), //'Query String (For example: value_1=1&value_2=2) ',	
                    setup : function( data )
                    {                      
                        if ( data.qstring )
                            this.setValue( data.qstring );
                    },
                    commit : function( data )
                    {
                        data.qstring = this.getValue();                    
                    }                    
                  },
                   {
                    type : 'button',                   
                    id : 'clearquerystring',									
                    onClick:  function() {
                        var dialog = this.getDialog();
                        var qs_id = dialog.getContentElement('advanced', 'queryString').getInputElement().$.id;
                        var qs = document.getElementById(qs_id);                       
                        qs.value = "";
                    },
                    label : translateItem('ResetQS'), //'Reset Query String'	
                  },                
					{
						type : 'vbox',
						padding : 1,
						hidden: true,
						children :
						[

							{
								type : 'hbox',
								widths : [ '45%', '55%' ],
								children :
								[
									{
										type : 'text',
										label : linkLang.cssClasses,
										'default' : '',
										id : 'advCSSClasses',
										setup : setupAdvParams,
										commit : commitAdvParams

									},
									{
										type : 'text',
										label : linkLang.charset,
										'default' : '',
										id : 'advCharset',
										setup : setupAdvParams,
										commit : commitAdvParams

									}
								]
							},
						]
					}
				]
			}
		],
		onShow : function()
		{
			var editor = this.getParentEditor(),
				selection = editor.getSelection(),
				element = null;
			// Fill in all the relevant fields if there's already one link selected.
			if ( ( element = plugin.getSelectedLink( editor ) ) && element.hasAttribute( 'href' ) )
				selection.selectElement( element );
			else
				element = null;
                
			this.setupContent( parseLink.apply( this, [ editor, element ] ) );        
		},

		onOk : function()
		{
            
            var ImagesAllowed = new RegExp( oDokuWiki_FCKEditorInstance.imageUploadAllowedExtensions);
			var attributes = {},
				removeAttributes = [],
				data = {},
				me = this,
				editor = this.getParentEditor();

			this.commitContent( data );
             var other_media = false;
			 
			// Compose the URL.			
		   var other_mime_file = "";
			switch ( data.type || 'url' )
			{
                case 'media':
                    if(document.getElementById(fckgMediaInputId).value) {
                        data.url.url =  document.getElementById(fckgMediaInputId).value;
                    }
                    data.adv.advTitle = data.url.url;
                    
                    var mf = data.url.url.match(/(\.(\w+))$/);           
                     other_mime_file = data.url.url.replace(/^:/,"");
                    data.url.url=top.dokuBase + 'doku.php?id=' + data.url.url;                         
                    
                    if( mf[1].match(ImagesAllowed)) {                        
                        data.adv['advContentType'] = 'linkonly';
                   }
                   else { 
                        data.adv['advContentType'] = "other_mime";            
                       data.url.url=top.dokuBase + 'lib/exe/fetch.php?media=' +  other_mime_file;
                         other_media = true;
                   }
                   data.adv[ 'advCSSClasses'] ="media mediafile";
                    if(mf) data.adv[ 'advCSSClasses'] += " mf_" + mf[2];
         			var protocol = ( data.url && data.url.protocol != undefined ) ? data.url.protocol : 'http://',
						url = ( data.url && CKEDITOR.tools.trim( data.url.url ) ) || '';
					attributes[ 'data-cke-saved-href' ] = ( url.indexOf( '/' ) === 0 ) ? url : protocol + url;                 
                break;
                case 'internal':                  
                     if(!data.url.url) {                                            
                        data.url.url=document.getElementById(fckgInternalInputId).value;
                              if(!data.url.url.match(/^:?\w+:/)) {
                                var ns = top.getCurrentWikiNS() + ':';
                                ns = ns.replace(/:$/,"");
                                var regex = new RegExp(':?'+ ns+':');   
                                if(!data.url.url.match(regex)) {           
                                     data.url.url = ns +':' + data.url.url;
                                     data.url.url = data.url.url.replace(/\:{2,}/g,':');                               
                                }
                            }
                        }                          

                     data.url.url =  data.url.url.replace(/^.*?\/data\/pages\//,"");
                     data.url.url = data.url.url.replace(/^\:/,"");
                     data.url.url =  ':' + data.url.url.replace(/\//g,':');      
                     data.adv.advCSSClasses = "wikilink1";
                     if(oDokuWiki_FCKEditorInstance.useheading == 'y') {
                         data.adv.advTitle = useHeading(data.url.url)
                    }
                     else {
                     data.adv.advTitle = data.url.url;
                     }   
                     data.url.url=top.dokuBase + 'doku.php?id=' + data.url.url;   
                     if(data.hash) { data.url.url += '#' +data.hash;  }
                     if(data.qstring) { data.url.url += '&' +data.qstring;  }
                 	var protocol = ( data.url && data.url.protocol != undefined ) ? data.url.protocol : 'http://',
						url = ( data.url && CKEDITOR.tools.trim( data.url.url ) ) || '';
					attributes[ 'data-cke-saved-href' ] = ( url.indexOf( '/' ) === 0 ) ? url : protocol + url;              
                     break;
                case 'interwiki':    
                      if( ckg_iwikiClass) {
                       data.adv.advCSSClasses =    ckg_iwikiClass;
                      }
                     else data.adv.advCSSClasses = 'interwiki ' + 'iw_' + data.url.iwiki_shortcut;
                      
                    var iwiki_pattern = ckgeditIwikiData[data.url.iwiki_shortcut];
                    data.url.url.selection = 'oIWIKIo'+data.url.selection+'cIWIKIc';
                 
                    if(iwiki_pattern.match(/\{.*?\}/) ){  
                       data.url.url = ckgeditIwikiData[data.url.iwiki_shortcut].replace(/{.*?}/,data.url.selection);
                    }                           
                   else data.url.url = iwiki_pattern + data.url.selection;                   
                    data.adv.advTitle = data.url.url;
                  	attributes[ 'data-cke-saved-href' ] =  data.url.url;
                  break;
				case 'url':               
					var protocol = ( data.url && data.url.protocol != undefined ) ? data.url.protocol : 'http://',
						url = ( data.url && CKEDITOR.tools.trim( data.url.url ) ) || '';                       
					attributes[ 'data-cke-saved-href' ] = ( url.indexOf( '/' ) === 0 ) ? url : protocol + url;    

					break;
				case 'anchor':
					var name = ( data.anchor && data.anchor.name ),
						id = ( data.anchor && data.anchor.id );
					attributes[ 'data-cke-saved-href' ] = '#' + ( name || id || '' );
					break;                
                 case 'samba':				
				   if(!data.url.url) {                                            
				      data.url.url=document.getElementById(getSMBInput()).value;
				   }
					if(!data.url.url) { 
						  alert("Missing Samba Url");
						  return false;
					}
					data.url.protocol = "";
				    var protocol = "";    // ( data.url && data.url.protocol != undefined ) ? data.url.protocol : '',
					url = ( data.url && CKEDITOR.tools.trim( data.url.url ) ) || '';
					attributes[ 'data-cke-saved-href' ] = ( url.indexOf( '/' ) === 0 ) ? url : protocol + url;  	
					data.adv.advCSSClasses = "windows";
					data.adv.advTitle = data.url.url;
				break;
				case 'email':

					var linkHref,
						email = data.email,
						address = email.address;

					switch( emailProtection )
					{
						case '' :
						case 'encode' :
						{
							var subject = encodeURIComponent( email.subject || '' ),
								body = encodeURIComponent( email.body || '' );

							// Build the e-mail parameters first.
							var argList = [];
   							body && argList.push( 'body=' + body );
							subject && argList.push( 'subject=' + subject );

							argList = argList.length ? '?' + argList.join( '&' ) : '';

							if ( emailProtection == 'encode' )
							{
								linkHref = [ 'javascript:void(location.href=\'mailto:\'+',
											 protectEmailAddressAsEncodedString( address ) ];
								// parameters are optional.
								argList && linkHref.push( '+\'', escapeSingleQuote( argList ), '\'' );

								linkHref.push( ')' );
							}
							else
								linkHref = [ 'mailto:', address, argList ];

							break;
						}
						default :
						{
							// Separating name and domain.
							var nameAndDomain = address.split( '@', 2 );
							email.name = nameAndDomain[ 0 ];
							email.domain = nameAndDomain[ 1 ];

							linkHref = [ 'javascript:', protectEmailLinkAsFunction( email ) ];
						}
					}

					attributes[ 'data-cke-saved-href' ] = linkHref.join( '' );
                   
					break;
			}


			// Advanced attributes.
			if ( data.adv )
			{
				var advAttr = function( inputName, attrName )
				{
					var value = data.adv[ inputName ];
					if ( value )
						attributes[attrName] = value;
					else
						removeAttributes.push( attrName );
				};

				advAttr( 'advId', 'id' );
				advAttr( 'advLangDir', 'dir' );
				advAttr( 'advAccessKey', 'accessKey' );

				if ( data.adv[ 'advName' ] )
					attributes[ 'name' ] = attributes[ 'data-cke-saved-name' ] = data.adv[ 'advName' ];
				else
					removeAttributes = removeAttributes.concat( [ 'data-cke-saved-name', 'name' ] );

				advAttr( 'advLangCode', 'lang' );
				advAttr( 'advTabIndex', 'tabindex' );
                if(!other_media) {
				    advAttr( 'advTitle', 'title' );
                }
				advAttr( 'advContentType', 'type' );
				advAttr( 'advCSSClasses', 'class' );
				advAttr( 'advCharset', 'charset' );
				advAttr( 'advStyles', 'style' );
				advAttr( 'advRel', 'rel' );
			}

			var selection = editor.getSelection();
            var hasSelectedText = selection.getSelectedText() ? selection.getSelectedText() : false;
			// Browser need the "href" fro copy/paste link to work. (#6641)
			attributes.href = attributes[ 'data-cke-saved-href' ];

			if ( !this._.selectedElement )
			{
               
				// Create element if current selection is collapsed.
              
				var ranges = selection.getRanges( true );
				if ( ranges.length == 1 && ranges[0].collapsed )
				{
                    
					// Short mailto link text view (#5736).
                  
					var text = new CKEDITOR.dom.text( data.type == 'email' ?
							data.email.address : attributes[ 'data-cke-saved-href' ], editor.document );
                   
					ranges[0].insertNode( text );
					ranges[0].selectNodeContents( text );
					selection.selectRanges( ranges );
                   
				}

   
             if(navigator.userAgent.match(/(Trident|MSIE)/)) {
                    var el = editor.document.createElement( 'a' );
                    el.setAttribute( 'href',  attributes['href']);
                    if(!hasSelectedText &&  (data.type == 'media' || data.type == 'internal')) {
                        el.setHtml(data.adv.advTitle);                  
                    }
                    else el.setHtml(selection.getSelectedText());                  
                    for(attr in attributes) {
                         if(attr.match(/href/i))continue;
                         el.setAttribute( attr,  attributes[attr]);
                    }
                    editor.insertElement( el );
                }				
                else {  // Apply style.   
                    var style = new CKEDITOR.style( { element : 'a', attributes : attributes } );
                    style.type = CKEDITOR.STYLE_INLINE;		// need to override... dunno why.
                    style.apply( editor.document );
                }
			}
			else
			{
              
				// We're only editing an existing link, so just overwrite the attributes.
				var element = this._.selectedElement,
					href = element.data( 'cke-saved-href' ),
					textView = element.getHtml();
                 if(other_media) {
                     attributes['type'] = 'other_mime';   
                     attributes['title'] = ':' + other_mime_file;   
                 }    
				element.setAttributes( attributes );
				element.removeAttributes( removeAttributes );

				if ( data.adv && data.adv.advName && CKEDITOR.plugins.link.synAnchorSelector )
					element.addClass( element.getChildCount() ? 'cke_anchor' : 'cke_anchor_empty' );

				// Update text view when user changes protocol (#4612).
				if ( href == textView || data.type == 'email' && textView.indexOf( '@' ) != -1 )
				{
					// Short mailto link text view (#5736).
					element.setHtml( data.type == 'email' ?
						data.email.address : attributes[ 'data-cke-saved-href' ] );
				}

				selection.selectElement( element );
				delete this._.selectedElement;
			}
           
            if(text && data.adv.advTitle) {            
                  text.setText(data.adv.advTitle);                                
            }
		},
		onLoad : function()
		{
	       ckgeditIwikiData = getIwikiOptions();         
           var select_id = this.getContentElement('info',  'iwiki_shortcut').getInputElement().$.id;     
           var select =document.getElementById(select_id);
           this.stack = select.options;
     
        this.stack.length = 0;
        this.stack[0] = (new Option("Not Set","not-set",false,false));
        ckgeditIwikiIndex = new Array();
        var count = 1;
        for(var i in ckgeditIwikiData) {
            this.stack[count] =  new Option(ckgeditIwikiData[i],i,false,false); 
            ckgeditIwikiIndex[i] = count;
            count++;            
        }
         
        
            oDokuWiki_FCKEditorInstance.isDwikiImage = false;			
			fckgInternalInputId = this.getContentElement('info', 'internal').getInputElement().$.id;
            fckgMediaInputId = this.getContentElement('info', 'media').getInputElement().$.id;
            fckgSMBInputId = this.getContentElement('info', 'samba').getInputElement().$.id;
            var el = this.getContentElement('info', 'iwiki_shortcut').getInputElement().$.id;        
           //this.getContentElement("info", 'iwiki_shortcut'). disable();  //restricts attempts to enter filenames into text box
           this.getContentElement('info', 'media').disable();
		   this.hidePage( 'advanced' );		//Hide Advanded tab.
	       this.showPage('info');				
           ckg_dialog = this;
           var tab = this._.tabs[ 'advanced' ] && this._.tabs[ 'advanced' ][ 0 ];               
           var dialog = this;                  
           var notSet = translateItem('NotSetOption');           
           tab.on('focus', function(evt) {      
               var select_id = dialog.getContentElement('advanced', 'internalAnchor').getInputElement().$.id;          
               var select =document.getElementById(select_id); 
               select.selectedIndex = -1;
               select.options.length = 0;                   
               select.options[0] =  new Option(notSet,"",false,false);               
           });             
   
		},
	

		// Inital focus on 'url' field if link is of type URL.
		onFocus : function()
		{
			var linkType = this.getContentElement( 'info', 'linkType' ),
					urlField;
			if ( linkType && linkType.getValue() == 'url' )
			{
				urlField = this.getContentElement( 'info', 'url' );
				urlField.select();
			}
		}
	};
});
    
   

/**
 * The e-mail address anti-spam protection option. The protection will be
 * applied when creating or modifying e-mail links through the editor interface.<br>
 * Two methods of protection can be choosed:
 * <ol>	<li>The e-mail parts (name, domain and any other query string) are
 *			assembled into a function call pattern. Such function must be
 *			provided by the developer in the pages that will use the contents.
 *		<li>Only the e-mail address is obfuscated into a special string that
 *			has no meaning for humans or spam bots, but which is properly
 *			rendered and accepted by the browser.</li></ol>
 * Both approaches require JavaScript to be enabled.
 * @name CKEDITOR.config.emailProtection
 * @since 3.1
 * @type String
 * @default '' (empty string = disabled)
 * @example
 * // href="mailto:tester@ckeditor.com?subject=subject&body=body"
 * config.emailProtection = '';
 * @example
 * // href="<a href=\"javascript:void(location.href=\'mailto:\'+String.fromCharCode(116,101,115,116,101,114,64,99,107,101,100,105,116,111,114,46,99,111,109)+\'?subject=subject&body=body\')\">e-mail</a>"
 * config.emailProtection = 'encode';
 * @example
 * // href="javascript:mt('tester','ckeditor.com','subject','body')"
 * config.emailProtection = 'mt(NAME,DOMAIN,SUBJECT,BODY)';
 */
