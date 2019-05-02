# create .npmignore base on .gitignore
cp .gitignore .npmignore
# whitelist .gitignore and dist folder in .npmignore
# so that npm will pick these two when packing
echo '!.gitignore' >> .npmignore
echo '!dist' >> .npmignore
echo '!build' >> .npmignore
