(function($) {
$(function() {

	$('#query').focus();
	$('form').submit(function(e) {
		e.preventDefault();

		if ( $('#query').val() !== '' ) {

			$('#items').off();
			$('#loading').show();
			$('#fail').remove();
			$('div.item').addClass('hidden');
			var query = $('#query').val();
			if (!/^jquery$/i.test(query)) query = '*' + query + '*';

			$.getJSON('http://api.jsdelivr.com/v1/jsdelivr/libraries?name=' + query, function(data) {

				// сортируем входящий JSON по имени проекта
				data.sort(function(a, b){
					var a1 = a.name, b1 = b.name;
					if (a1 == b1) return 0;
					return a1 > b1? 1: -1;
				});

				// получаем список файлов
				function filesList(name, version) {
					var files = '';
					$.each(data, function(index, item) {
						if (item.name == name) {
							for (var j = 0; j < item.assets.length; j++) {
								if (item.assets[j].version == version) {
									for (var k = 0; k < item.assets[j].files.length; k++) {
										var file = item.assets[j].files[k];
										if (/.js/.test(file)) {
											files +=
												'<li data-name="' + item.name + '" data-version="' + version + '" data-file="' + file + '" data-mainfile="' + item.mainfile + '">' +
												'<div class="item__checkbox"></div>' +
												'//cdn.jsdelivr.net/' + item.name + '/' + version + '/' + file +
												'</li>';
										}
									}
									if (files === '') files = '<li class="alert">This project does not contain JavaScript files.</li>';
								}
							}
						}
					}); // $.each
					return '<ul>' + files + '</ul>';
				}

				function createResults() {
					var item = $('div.item');
					var result = $('#result');
					var itemArray = [];

					item.each(function(i) {
						itemArray[i] = [];
						var filesArray = [];
						$(this).find('div.item__files li.active').each(function(k) {
							filesArray[k] = [];
							filesArray[k].name = $(this).data('name');
							filesArray[k].version = $(this).data('version');
							filesArray[k].file = $(this).data('file');
							filesArray[k].mainfile = $(this).data('mainfile');
						});
						itemArray[i] = filesArray;
					});

					/* ==============================
					Создание итоговой ссылки
					============================== */
					var listAll = '';
					// проходим по каждому блоку
					for (var i = 0; i < itemArray.length; i++) {
						var listItem = '';
						// если выбран только один файл в списке
						if ( itemArray[i].length == 1 ) {
							if ( itemArray[i][0].file == itemArray[i][0].mainfile ) {
								listItem = ',' + itemArray[i][0].name + '@' + itemArray[i][0].version;
							} else {
								listItem = ',' + itemArray[i][0].name + '@' + itemArray[i][0].version + '(' + itemArray[i][0].file + ')';
							}
						// если выбрано больше одного файла в списке
						} else if ( itemArray[i].length > 1 ) {
							// проходим по каждому списку файлов в блоке
							for (var k = 0; k < itemArray[i].length; k++) {
								listItem += '+' + itemArray[i][k].file;
							}
							listItem = listItem.substring(1);
							listItem = ',' + itemArray[i][0].name + '@' + itemArray[i][0].version + '(' + listItem + ')';
						}
						listAll += listItem;
						listAll = listAll.replace(/^,/, '');
					}
					if (listAll === '') {
						result.val('');
					} else {
						var http = '';
						if ( localStorage.option_http == 1 ) http = 'http:';
						if ( localStorage.option_script == 1 ) {
							listAll = '<script src="' + http + '//cdn.jsdelivr.net/g/' + listAll + '"></script>';
						} else {
							listAll = http + '//cdn.jsdelivr.net/g/' + listAll;
						}
						result.val(listAll);
					}

					/* ==============================
					Создание списка файлов результата
					============================== */
					// проходим по каждому блоку
					var files = '';
					for (var l = 0; l < itemArray.length; l++) {
						// проходим по каждому списку файлов в блоке
						for (var j = 0; j < itemArray[l].length; j++) {
							files += '<div class="files__file" data-file="' + itemArray[l][j].file + '">' + itemArray[l][j].file + ' (' + itemArray[l][j].version + ')</div>';
						}
					}
					if ( files !== '' ) {
						$('#files').addClass('filled');
					} else {
						$('#files').removeClass('filled');
					}
					$('#files').html(files);
				}

				// добавляем блоки с проектами
				$.each(data, function(index, item) {
					var ver = item.versions;
					var versions = '',
							github = '';
					var lastVersion = item.lastversion;
					for (var i = 0; i < ver.length; i++) {
						versions += '<li>' + ver[i] + '</li>';
					}
					versions = '<div class="item__versions-current">' + lastVersion + '</div><ul>' + versions + '</ul>';
					if (item.github) github = '<div class="item__github"><a href="' + item.github + '" target="_blank">GitHub</a></div>';

					if ( $('#items').find('div.item[data-name="' + item.name + '"]').length < 1 ) {
						$('#items').append(
							'<div class="item" data-name=' + item.name + '>' +
								'<div class="item__name">' + item.name + '</div>' +
								'<div class="item__versions">' + versions + '</div>' +
								'<div class="item__homepage"><a href="' + item.homepage + '" target="_blank">Website</a></div>' +
								github +
								'<div class="item__desc">' + item.description + '</div>' +
								'<div class="item__files">' + filesList(item.name, lastVersion) + '</div>' +
							'</div>'
						);
					} else {
						$('#items').find('div.item.hidden[data-name="' + item.name + '"]').removeClass('hidden');
					}

				}); // $.each

				// открываем выпадающий список версий
				$('#items').on('click', 'div.item__versions-current', function() {
					var dropdown = $(this).parent().find('ul');
					if ( dropdown.is(':hidden') ) {
						dropdown.show();
					} else {
						dropdown.hide();
					}
				})
				// клик по версии в выпадающем списке
				.on('click', 'div.item__versions li', function() {
					var el = $(this);
					var currentVersion = el.closest('div.item__versions').find('div.item__versions-current');
					var clickedVersion = el.text();
					var itemName = el.closest('div.item').data('name');
					if ( clickedVersion != currentVersion.text() ) {
						currentVersion.text( el.text() ).next().hide();
						el.closest('div.item').find('div.item__files').html(filesList(itemName, clickedVersion));
					}
					createResults();
				})
				// клик по чекбоксу
				.on('click', 'div.item__checkbox', function() {
					// переключаем чекбокс и строку с файлом
					if ( $(this).is('.active') ) {
						$(this).parent().addBack().removeClass('active');
					} else {
						$(this).parent().addBack().addClass('active');
					}
					createResults();
				});

				// прячем выпадающий список при клике за его пределами
				$('body').on('click', function(e) {
					if (!$(e.target).parents().hasClass('item__versions')) {
						$('div.item__versions ul').hide();
					}
				});

				// клик по файлу в результатах
				$('#files').on('click', 'div.files__file', function() {
					var file = $(this).data('file');
					$('div.item__files li.active').each(function() {
						if ( $(this).data('file') == file ) {
							$(this).find('div.item__checkbox').click();
						}
					});
				});

			}).done(function(data) {
				$('#loading').hide();
				if (data.length < 1) {
					$('#items').after('<div id="fail" class="fail">Sorry, nothing found =(</div>');
				}
			}); // $.getJSON

		} else {
			$('#query').focus();
		}

	}); // $('form').submit()

	// фиксированный блок
	var win = $(window);
	var fixed = $('#fixed');
	var fixedOffset = $('#fixed').offset().top;
	win.scroll(function() {
		if ( win.scrollTop() >= fixedOffset ) {
			fixed.addClass('isFixed');
		} else {
			fixed.removeClass('isFixed');
		}
	});

	// переключение опций
	var option = $('div.option');
	option.each(function() {
		if ( localStorage[ 'option_' + $(this).data('option') ] == 1 ) $(this).addClass('active');
	});
	option.click(function() {
		var el = $(this);
		var result = $('#result');
		var resultVal = result.val();
		var http = '';

		if ( el.is('.active') ) {
			el.removeClass('active');
			localStorage[ 'option_' + $(this).data('option') ] = 0;
		} else {
			el.addClass('active');
			localStorage[ 'option_' + $(this).data('option') ] = 1;
		}

		if ( el.data('option') == 'script' ) {
			if ( localStorage.option_script == 1 ) {
				resultVal = '<script src="'+ resultVal + '"></script>';
			} else {
				resultVal = resultVal.replace('<script src="', '');
				resultVal = resultVal.replace('"></script>', '');
			}
			result.val(resultVal);
		} else if ( el.data('option') == 'http' ) {
			if ( localStorage.option_http == 1 ) {
				http = 'http:';
				if ( localStorage.option_script == 1 ) resultVal = resultVal.replace('"//', '"' + http + '//');
				else resultVal = http + resultVal;
			} else {
				resultVal = resultVal.replace('http:', '');
			}
			result.val(resultVal);
		}

	});

});
})(jQuery);