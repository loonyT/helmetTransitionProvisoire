import difflib

file1 = open('index.html', 'r').readlines()
file2 = open('indexLive.html', 'r').readlines()

htmlDiffer = difflib.HtmlDiff()
htmldiffs = htmlDiffer.make_file(file1, file2)

with open('comparison.html', 'w') as outfile:
    outfile.write(htmldiffs)