workflow "Publish Tag" {
  on       = "push"

  resolves = [
    "publish"
  ]
}

action "install" {
  uses = "actions/npm@master"

  args = [
    "install --unsafe-perm"
  ]
}

action "build" {
  uses  = "actions/npm@master"

  needs = [
    "install"
  ]

  args  = [
    "run build"
  ]
}

action "tag-filter" {
  uses  = "actions/bin/filter@master"
  args  = "tag"

  needs = [
    "build"
  ]
}

action "publish" {
  uses    = "lannonbr/vsce-action@master"
  args    = "publish -p $VSCE_TOKEN"

  needs   = [
    "tag-filter"
  ]

  secrets = [
    "VSCE_TOKEN"
  ]
}
