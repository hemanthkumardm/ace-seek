# aic helpers
IMAGE   ?= aic
SAMPLE  ?= examples/sample.md
ENGINE  ?= xelatex

.PHONY: help install deps template sample sample-docker docker-build clean

help:
	@echo "Targets:"
	@echo "  make deps           install pandoc + TeX (needs sudo)"
	@echo "  make install        symlink aic → ~/bin"
	@echo "  make template       install editable Pandoc LaTeX template"
	@echo "  make sample         compile examples/sample.md (host TeX)"
	@echo "  make sample-docker  compile sample via Docker"
	@echo "  make docker-build   build aic image"
	@echo "  make clean          remove generated pdf/tex/aux"

deps:
	./scripts/install-deps.sh

install:
	mkdir -p $(HOME)/.local/bin
	ln -sfn $(CURDIR)/bin/aic $(HOME)/.local/bin/aic
	chmod +x bin/aic scripts/*.sh
	@echo "Installed: $(HOME)/.local/bin/aic"
	@echo 'Ensure ~/.local/bin is on PATH: export PATH="$$HOME/.local/bin:$$PATH"'

template:
	./scripts/install-template.sh

docker-build:
	docker build -t $(IMAGE) .

sample:
	./bin/aic --engine=$(ENGINE) $(SAMPLE)

sample-docker: docker-build
	./bin/aic --docker --engine=$(ENGINE) $(SAMPLE)

clean:
	rm -f examples/*.pdf examples/*.tex examples/*.aux examples/*.log \
	      examples/*.out examples/*.toc examples/*.fls examples/*.fdb_latexmk \
	      examples/*.synctex.gz
