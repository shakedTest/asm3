/*jslint browser: true, forin: true, eqeq: true, white: true, sloppy: true, vars: true, nomen: true */
/*global $, jQuery, _, asm, common, config, controller, dlgfx, format, header, html, tableform, validate */

$(function() {

    var sql = {

        render: function() {
            return [
                this.render_scriptdialog(),
                html.content_header(_("SQL Interface")),
                '<div id="dialog-dump" class="hidden" title="' + html.title(_("Confirm")) + '">',
                _("This can take some time and generate a large file, are you sure?") + '</div>',
                '<div class="asm-toolbar">',
                tableform.buttons_render([
                    { id: "exec", text: _("Execute"), tooltip: _("Execute the SQL in the box below"), icon: "sql" },
                    { id: "script", text: _("Execute Script"), tooltip: _("Upload an SQL script"), icon: "sql" },
                    { id: "export", text: _("Export"), tooltip: _("Export this database in various formats"), icon: "database",
                        type: "buttonmenu", 
                    options: [ 
                        "dumpsql|" + _("SQL dump"), 
                        "dumpsqlnomedia|" + _("SQL dump (without media)"),
                        // ASM2_COMPATIBILITY
                        "dumpsqlasm2|" + _("SQL dump (ASM2 HSQLDB Format)"),
                        "dumpsqlasm2nomedia|" + _("SQL dump (ASM2 HSQLDB Format, without media)"),
                        "animalcsv|" + _("CSV of animal/adopter data"), 
                        "personcsv|" + _("CSV of person data") ]}
                ], true),
                '<span style="float: right">',
                '<label for="tables">' + _("Table") + '</label>',
                '<select id="tables" data="table" class="asm-selectbox">',
                '<option></option>',
                sql.render_table_options(),
                '</select>',
                '<label for="columns">' + _("Column") + '</label>',
                '<select id="columns" class="asm-selectbox">',
                '</select>',
                '</span>',
                '</div>',
                '<textarea id="sql" class="asm-textarea" style="font-family: monospace" data="sql" rows="10"></textarea>',
                '<hr />',
                '<table id="sql-results"></table>',
                html.content_footer()
            ].join("\n");
        },

        render_scriptdialog: function() {
            return [
                '<div id="dialog-script" style="display: none" title="' + html.title(_("Execute Script")) + '">',
                '<form id="sqlfileform" action="sql" method="post" enctype="multipart/form-data">',
                '<input name="mode" value="execfile" type="hidden" />',
                '<label for="sqlfile">' + _("Script") + ' <input id="sqlfile" type="file" name="sqlfile" /></label>',
                '</form>',
                '</div>'
            ].join("\n");
        },

        render_table_options: function() {
            var h = [];
            $.each(controller.tables, function(i, v) {
                h.push("<option>" + v + "</option>");
            });
            return h.join("\n");
        },

        /** One of the three dump button choices so once the confirm dialog has been agreed
         *  to, we know where to redirect to
         */
        dumpchoice: "dumpsql",

        bind_scriptdialog: function() {

            var b = { };
            b[_("Execute Script")] = function() {
                if (!validate.notblank([ "sqlfile" ])) { return; }
                $("#sqlfileform").submit();
            };
            b[_("Cancel")] = function() {
                $("#dialog-script").dialog("close");
            };
            $("#dialog-script").dialog({
                autoOpen: false,
                width: 550,
                modal: true,
                dialogClass: "dialogshadow",
                show: dlgfx.edit_show,
                hide: dlgfx.edit_hide,
                buttons: b
            });

        },

        bind: function() {
            this.bind_scriptdialog();
            $("#tables").change(function() {
                var formdata = "mode=cols&" + $("#tables").toPOST();
                header.show_loading(_("Loading..."));
                common.ajax_post("sql", formdata, function(result) { 
                    var cols = result.split("|");
                    var h = "<option></option>";
                    $.each(cols, function(i, v) {
                        h += "<option>" + v + "</option>";
                    });
                    $("#columns").html(h);
                }, function() {
                    $("#button-exec").button("enable");
                });
            });

            $("#columns").change(function() {
                $("#sql").val( $("#sql").val() + $("#columns").val() + ", " );
            });

            var dbuttons = {};
            dbuttons[_("Yes")] = function() {
                $(this).dialog("close");
                common.route("sql?ajax=false&mode=" + sql.dumpchoice);
            };
            dbuttons[_("No")] = function() {
                $(this).dialog("close");
            };

            var confirm_dump = function(action) {
                sql.dumpchoice = action;
                $("#dialog-dump").dialog({ 
                    autoOpen: true,
                    modal: true,
                    dialogClass: "dialogshadow",
                    show: dlgfx.add_show,
                    hide: dlgfx.add_hide,
                    buttons: dbuttons 
                });
            };

            // Handles all export menu clicks by passing the action on to confirm_dump
            $("#button-export").asmmenu();
            $("#button-export-body a").click(function() {
                confirm_dump($(this).attr("data"));
                return false;
            });

            $("#button-exec").button().click(function() {
                var formdata = "mode=exec&" + $("#sql").toPOST();
                $("#button-exec").button("disable");
                header.show_loading(_("Executing..."));
                common.ajax_post("sql", formdata, function(result) { 
                    if (result.indexOf("<thead") == 0) {
                        $("#sql-results").html(result);
                        $("#sql-results").table();
                        $("#sql-results").fadeIn();
                        var norecs = String($("#sql-results tr").length - 1);
                        header.show_info(_("{0} results.").replace("{0}", norecs));
                    }
                    else {
                        $("#sql-results").fadeOut();
                        if (result != "") {
                            header.show_info(result);
                        }
                        else {
                            header.show_info(_("No results."));
                        }
                    }
                    $("#button-exec").button("enable");
                }, function() {
                    $("#button-exec").button("enable");
                });
            });

            $("#button-script").button().click(function() {
                $("#dialog-script").dialog("open");
            });
        },

        name: "sql",
        animation: "options",
        autofocus: "#sql",
        title: function() { return _("SQL Interface"); },

        destroy: function() {
            common.widget_destroy("#dialog-script");
        },

        routes: {
            "sql": function() {
                common.module_loadandstart("sql", "sql");
            }
        }


    };

    common.module_register(sql);

});
