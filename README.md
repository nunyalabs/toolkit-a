# Hypertension Research Toolkit (PWA)

Offline-first, modular data collection toolkit with participant screening, IDI/FGD interviews, audio recording, and embedded guides.

## Live site

https://nunyalabs.github.io/toolkit-a/

## Repository strategy

- Source code is kept locally and is NOT pushed to the main branch.
- The public site is served from the `gh-pages` branch containing only the built `dist/` output.
- The `main` branch contains only this README (and optionally a .gitignore).

## How to publish updates

1) Build locally into `dist/` (copy/minify assets as needed)

2) Push only `dist/` to the `gh-pages` branch from the project root:

	```sh
	git subtree push --prefix dist origin gh-pages
	```

	If `gh-pages` doesn’t exist yet, create it once (or use the sequence you already ran):

	```sh
	git switch --orphan gh-pages
	git rm -rf .
	mkdir dist
	# copy built files into dist/
	cp -r <build_output>/* dist/
	cp dist/index.html dist/404.html
	touch dist/.nojekyll
	git add dist
	git commit -m "chore: initial gh-pages publish"
	git subtree push --prefix dist origin gh-pages
	git switch main
	```

Pages settings:
- Settings → Pages → Branch: `gh-pages`, Folder: `/`.


