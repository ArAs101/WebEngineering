export function renderBears(bears) {
    var moreBears = document.querySelector('.more_bears');
    bears.forEach(function(bear) {
        var html = '<div class="bear">' +
        '<img src="' + bear.image + '" alt="Image of ' + bear.name + '" style="width:200px; height:auto;">' +
        '<p><b>' + bear.name + '</b> (' + bear.binomial + ')</p>' +
        '<p>Range: ' + bear.range + '</p>' +
        '</div>';
        moreBears.innerHTML += html;
    });
}