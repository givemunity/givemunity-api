PROJECT_ROOT_PATH=$1

echo "Installing node_modules dependencies in project root"

cd "${PROJECT_ROOT_PATH}"
npm install

for dir in ./func/*/     # list directories
do
    cd "${dir}"
    echo "Installing node_modules dependencies in ${dir}"
    npm install
    cd ../..
done