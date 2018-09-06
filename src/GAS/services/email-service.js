/**
 * @file A service focused on sending emails.
 * @author {@link https://github.com/j-rewerts|Jared Rewerts}
 */

/**
 * This service handles sending emails using MergeTemplates.
 * TODO Performance improvements in here could be very important.
 *
 * @type {Object}
 */
var EmailService = {

  /**
   * Runs a MergeTemplate, sending emails as needed. This actually reloads the MergeTemplate,
   * so it runs the most up to date version.
   *
   * @method
   * @param {MergeTemplate} template The MergeTemplate to run.
   */
  startMergeTemplate: function(template, options) {
    console.log('EmailService.startMergeTemplate() - BEGIN');
    try {
      MergeTemplateService.validate(template);
    }
    catch(e) {
      console.log('EmailService.startMergeTemplate() - ERROR');
      console.log(e);
      throw e;
    }

    template = MergeTemplateService.getByID(template.id);
    if (template === null) {
      console.log('EmailService.startMergeTemplate() - Early exit because template with id ' + template.id + ' was not found');
      return;
    }

    if ((options || {}).type === 'OnFormSubmit' && template.mergeData.repeater == "onform"){
      // ensure the form submitted is on the sheet the mergeTemplate is looking at
      var range = ((options || {}).args || {}).range;
      if (range && range.getSheet && range.getSheet().getName && range.getSheet().getName() === template.mergeData.sheet) {
        console.log('EmailService.startMergeTemplate() - Starting mergeOnformTemplate because the sheet is a form sheet');
        EmailService.mergeOnformTemplate(template, options.args);
      } else {
        console.log('EmailService.startMergeTemplate() - Not running mergeOnFormTemplate because the sheet specified in the mergeTemplate is not the one where the form data was submitted');
      }
    }
    else if (template.mergeData.repeater == "auto" || template.mergeData.repeater == "off"){
      EmailService.mergeAllTemplate(template);
    }
    console.log('EmailService.startMergeTemplate() - END');

  },

  mergeOnformTemplate: function(template, args) {
    console.log('EmailService.mergeOnformTemplate() - BEGIN');

    var ss = Utility.getSpreadsheet();
    var sheet = ss.getSheetByName(template.mergeData.sheet);
    var range = ((args || {}).range || sheet.getDataRange());
    var headerRow = template.mergeData.headerRow;
    var i = range.getNumRows()-1;
    var rowNum = range.getRowIndex() + i;
    console.log('Getting data from row ' + rowNum);
    var numColumns =  sheet.getDataRange().getNumColumns();
    var row = range.offset(i, 0, 1,numColumns);
    var nextRow;
    try { nextRow = sheet.getRange(rowNum+1, 1, 1, numColumns);} catch (e) { console.log(e) /* log and eat exceptions */ }
    if (nextRow) {
      EmailService.tryFillNewFormRowExtraColumns(row, nextRow, range.getNumColumns()+1, numColumns);
    } else {
      console.log('EmailService.mergeOnformTemplate() - not going to call tryFillNewFormRowExtraColumns() because a next row was not found');
    }
    console.log('EmailService.mergeOnformTemplate() - i=' + i + ', rowNum=' + rowNum);
    var context = RenderService.getContext(template.mergeData.sheet, headerRow, rowNum);
    var renderOptions = { context: context };
    var header = HeaderService.get(template.mergeData.sheet, template.mergeData.headerRow);
    var conditional = template.mergeData.conditional ? RenderService.render(template.mergeData.conditional, renderOptions) : 'true';
    console.log('EmailService.mergeOnformTemplate() - conditional=' + conditional);
    if (conditional && typeof conditional.toLowerCase === 'function')
       conditional = conditional.toLowerCase();
      if (conditional === 'yes') // other keywords could be added here.
        conditional = 'true';
      if (conditional === 'true') {
        var to = template.mergeData.data.to ? RenderService.render(template.mergeData.data.to, renderOptions) : null;
        var cc = template.mergeData.data.cc ? RenderService.render(template.mergeData.data.cc, renderOptions) : null;
        var bcc = template.mergeData.data.bcc ? RenderService.render(template.mergeData.data.bcc, renderOptions) : null;
        var subject = template.mergeData.data.subject ? RenderService.render(template.mergeData.data.subject, renderOptions) : null;
        var body = template.mergeData.data.body ? RenderService.render(template.mergeData.data.body, renderOptions) : null;
        try {
          // We only timestamp when the email successfully sends.
          if ((conditional === 'true') &&
            EmailService.send(to, subject, body, cc, bcc, true)) {
            var timestampName = template.mergeData.timestampColumn.replace(/(<<|>>)/g, '');
            console.log('EmailService.mergeOnformTemplate() - timestampName=' + timestampName + ', index=' + header.indexOf(timestampName));
            var timeCell = row.getCell(1, header.indexOf(timestampName) + 1);
            console.log('EmailService.mergeOnformTemplate() - Setting timeCell in cell ' + timeCell.getA1Notation());

            var formattedDate = Utilities.formatDate(new Date(), 'America/Edmonton', "MM/dd/yyyy HH:mm:ss");
            timeCell.setValue(formattedDate);
          }
        }
        
        catch (e) {
          console.log('EmailService.mergeOnformTemplate() - ERROR');
          console.log(e);
        }        
      }

    console.log('EmailService.mergeOnformTemplate() - END');
  },

  tryFillNewFormRowExtraColumns: function(toRow, fromRow, startColumnIndex, endColumnIndex)
  {
    console.log('EmailService.tryFillNewFormRowExtraColumns() - BEGIN');
    if (startColumnIndex > endColumnIndex) {
      console.log('EmailService.tryFillNewFormRowExtraColumns() - Early exit because there are no cells to fill');
      return;
    }

    console.log('EmailService.tryFillNewFormRowExtraColumns() - Copying from ' + fromRow.getA1Notation() + ' to ' + toRow.getA1Notation());
    try {
      var originRange = fromRow.offset(0, startColumnIndex, 1, endColumnIndex-startColumnIndex);
      var target = toRow.offset(0, startColumnIndex, 1, endColumnIndex-startColumnIndex);
      originRange.copyTo(target);  
    } catch (ex) {
      console.log('EmailService.tryFillNewFormRowExtraColumns() - Early exit because there are no cells to fill');
      console.log(ex);
    }

    console.log('EmailService.tryFillNewFormRowExtraColumns() - END');
  },

  mergeAllTemplate: function(template) {
    console.log('EmailService.mergeAllTemplate() - BEGIN');

    var ss = Utility.getSpreadsheet();
    var sheet = ss.getSheetByName(template.mergeData.sheet);
    var range = sheet.getDataRange();
    var headerRow = template.mergeData.headerRow;

    for (var i = parseInt(template.mergeData.headerRow); i < range.getNumRows(); i++) {
      
      var rowNum = range.getRowIndex() + i;
      var row = range.offset(i, 0, 1, range.getNumColumns());
      var context = RenderService.getContext(template.mergeData.sheet, headerRow, rowNum);
      var renderOptions = { context: context };
      var header = HeaderService.get(template.mergeData.sheet, template.mergeData.headerRow);
      var conditional = template.mergeData.conditional ? RenderService.render(template.mergeData.conditional, renderOptions) : 'true';
      if (conditional && typeof conditional.toLowerCase === 'function')
        conditional = conditional.toLowerCase();
      if (conditional === 'yes') // other keywords could be added here.
        conditional = 'true';
      if (conditional === 'true') {
        var to = template.mergeData.data.to ? RenderService.render(template.mergeData.data.to, renderOptions) : null;
        var cc = template.mergeData.data.cc ? RenderService.render(template.mergeData.data.cc, renderOptions) : null;
        var bcc = template.mergeData.data.bcc ? RenderService.render(template.mergeData.data.bcc, renderOptions) : null;
        var subject = template.mergeData.data.subject ? RenderService.render(template.mergeData.data.subject, renderOptions) : null;
        var body = template.mergeData.data.body ? RenderService.render(template.mergeData.data.body, renderOptions) : null;
      
        try {
          // We only timestamp when the email successfully sends.
          if ((conditional === 'true') &&
            EmailService.send(to, subject, body, cc, bcc, true)) {

            var timestampName = template.mergeData.timestampColumn.replace(/(<<|>>)/g, '');
            var timeCell = row.getCell(1, header.indexOf(timestampName) + 1);
            var formattedDate = Utilities.formatDate(new Date(), 'America/Edmonton', "MM/dd/yyyy HH:mm:ss");

            timeCell.setValue(formattedDate);
          }
        }
        catch (e) {
          console.log('EmailService.mergeAllTemplate() - ERROR');
          console.log(e);
        }        
      }
    }

    console.log('EmailService.mergeAllTemplate() - END');
  },

  /**
   * Sends a test email to the current user.
   *
   * @param  {string} sheetName The name of the Sheet to send from.
   * @param  {string} headerRow The 1-based row the header is in.
   * @param  {string} subject The whack-whacked subject.
   * @param  {string} body The whack whacked body.
   */
  sendTest: function(sheetName, headerRow, subject, body) {
    log('Sending test email');
    var ss = Utility.getSpreadsheet();
    var sheet = ss.getSheetByName(sheetName);
    var range = sheet.getDataRange();

    var context = RenderService.getContext(null, headerRow, range.getRowIndex()+1);
    var renderOptions = { context: context };

    var subjectRendered = subject ? RenderService.render(subject, renderOptions) : null;
    var bodyRendered = body ? RenderService.render(body, renderOptions) : null;

    EmailService.send(Session.getActiveUser().getEmail(), subjectRendered, bodyRendered, null, null, true);
  },

  /**
   * Handles sending emails. Emails that don't have "to" defined return false.
   * Emails that contain closing </html> tags result in an html email being sent.
   *
   * @param {string} to The primary recipients of the email. Can be a comma delimited list of users.
   * @param {string} subject The subject of the email. This can be an empty string.
   * @param {string} body The body of the email. This can be an empty string.
   * @param {string|undefined} cc Secondary recipients of the email. Can be a comma delimited list of users.
   * @param {string|undefined} bcc Blind copied recipients. Can be a comma delimited list of users.
   * @param {boolean} isBodyHtml isBodyHtml explicitly sets the body text to be send as html
   * @return {boolean} true if the email was sent, false if it wasn't.
   */
  send: function(to, subject, body, cc, bcc, isBodyHtml) {
    console.log('EmailService.send() - BEGIN');
    if (to === '' || to == null) {
      log('Unable send email, invalid email address... ');
      return false;
    }
    var sendTime = Utilities.formatDate(new Date(), 'America/Edmonton', "MM/dd/yyyy HH:mm:ss");
    log('At '+sendTime+', Sending email to ' + JSON.stringify({
      to: to,
      cc: cc,
      bcc: bcc
    }));
    console.log("EmailService.send() - Sending email to " + to);

    if (isBodyHtml || /<html>/.test(body)) {
      GmailApp.sendEmail(to, subject, body, {
        htmlBody: body,
        cc: cc,
        bcc: bcc
      });
    }
    else {
      GmailApp.sendEmail(to, subject, body, {
        cc: cc,
        bcc: bcc
      });
    }

    console.log('EmailService.send() - END');
    return true;
  },

  /******* Private / utility functions *******/

  /**
   * Retrieves the required fields for an email to be sent.
   *
   * @param {String[]} headerRow An array of header values.
   * @param {String[]} row An array of row values.
   * @param {Object} template The MergeTemplate used to send the email. See the client-side object for info.
   * @return {Boolean} true if the email was sent, false otherwise.
   */
  getEmailFields: function(headerRow, row, template) {
    var valueMap = {};
    for (var j = 0; j < headerRow.length; j++) {
      valueMap[headerRow[j]] = row[j];
    }

    if (template.mergeData.type.toLowerCase() === 'email') {
      return {
        to: EmailService.replaceTags(template.mergeData.data.to, valueMap),
        cc: EmailService.replaceTags(template.mergeData.data.cc, valueMap),
        bcc: EmailService.replaceTags(template.mergeData.data.bcc, valueMap),
        subject: EmailService.replaceTags(template.mergeData.data.subject, valueMap),
        body: EmailService.replaceTags(template.mergeData.data.body, valueMap),
        conditional: EmailService.replaceTags(template.mergeData.conditional, valueMap).toLowerCase()
      };
    }
    else if (template.mergeData.type.toLowerCase() === 'document') {
      var bodyHTML = DocumentService.getDocumentAsHTML(template.mergeData.data.documentID);
      return {
        to: EmailService.replaceTags(template.mergeData.data.to, valueMap),
        cc: EmailService.replaceTags(template.mergeData.data.cc, valueMap),
        bcc: EmailService.replaceTags(template.mergeData.data.bcc, valueMap),
        subject: EmailService.replaceTags(template.mergeData.data.subject, valueMap),
        body: EmailService.replaceTags(bodyHTML, valueMap),
        conditional: EmailService.replaceTags(template.mergeData.conditional, valueMap).toLowerCase()
      };
    }

    return {};
  },

  /**
   * This function replaces  all instances of <<tags>> with the data in headerToData.
   *
   * @param {string} text The string that contains the tags.
   * @param {Object} headerToData A key-value pair where the key is a column name and the value is the data in the
   * column.
   * @return {string} The text with all tags replaced with data.
   */
  replaceTags: function(text, headerToData) {
    if (text == null) {
      text = '';
    }

    // This must match <<these>> and &lt;&lt;these&gt;&gt; since we need to support HTML.
    var dataText = text.replace(/<<(.*?)>>|&lt;&lt;(.*?)&gt;&gt;/g, function(match, m1, m2, offset, string) {
      if (m1 && headerToData[m1]) {
        return headerToData[m1];
      }
      else if (m2 && headerToData[m2]) {
        return headerToData[m2];
      }
      return '';
    });

    return dataText;
  }
};